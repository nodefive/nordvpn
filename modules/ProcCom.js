import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import Logger from './Logger.js';

function _cmdName(command) {
    return command.trim().split(/\s+/)[0].split('/').pop();
}

export default class ProcCom {
    constructor(props) {
        this._log = new Logger('ProcCom');
        Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');
        Gio._promisify(Gio.Subprocess.prototype, 'wait_async');
        Gio._promisify(Gio.InputStream.prototype, 'read_bytes_async');
    }

    async execCommunicateAsync(command, input = null) {
        let argv = command.split(/\s+/);
        const t = this._log.startTimer();
        const cmd = _cmdName(command);
        let proc;
        try {
            proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        } catch (e) {
            this._log.endTimer(t, 'CALL', {cmd, blocking: false, success: false});
            this._log.error('subprocess creation failed', e);
            throw e;
        }
        const [stdout, stderr] = await proc.communicate_utf8_async(null, null);
        const success = proc.get_successful();
        this._log.endTimer(t, 'CALL', {cmd, blocking: false, success});
        if (!success) throw new Error(stderr);
        return stdout;
    }

    // Run a command that may prompt for input or never finish: writes `input`
    // and closes stdin, merges stderr into stdout, keeps at most maxBytes of
    // output and kills the process after timeoutMs. Returns the output read so
    // far; never rejects because of the exit status.
    // Needed for `nordvpn login`: NordVPN 6 first asks for analytics consent
    // and, with nobody to answer, prints the question in a loop forever.
    async execBoundedAsync(command, {input = '', timeoutMs = 20000, maxBytes = 64 * 1024} = {}) {
        const argv = command.split(/\s+/);
        const t = this._log.startTimer();
        const cmd = _cmdName(command);
        const proc = Gio.Subprocess.new(argv,
            Gio.SubprocessFlags.STDIN_PIPE | Gio.SubprocessFlags.STDOUT_PIPE |
            Gio.SubprocessFlags.STDERR_MERGE);

        let timedOut = false;
        let timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, timeoutMs, () => {
            timedOut = true;
            timeoutId = 0;
            proc.force_exit();
            return GLib.SOURCE_REMOVE;
        });

        const chunks = [];
        let size = 0;
        try {
            const stdin = proc.get_stdin_pipe();
            try {
                if (input)
                    stdin.write_all(new TextEncoder().encode(input), null);
            } catch (e) {
                this._log.debug('stdin write failed', {cmd, error: String(e)});
            } finally {
                try { stdin.close(null); } catch { /* already closed */ }
            }

            const stdout = proc.get_stdout_pipe();
            while (size < maxBytes) {
                const bytes = await stdout.read_bytes_async(4096, GLib.PRIORITY_DEFAULT, null);
                const n = bytes.get_size();
                if (n === 0)
                    break;
                chunks.push(bytes.toArray());
                size += n;
            }
            if (size >= maxBytes)
                proc.force_exit();
            await proc.wait_async(null);
        } finally {
            if (timeoutId)
                GLib.Source.remove(timeoutId);
        }

        const all = new Uint8Array(size);
        let offset = 0;
        for (const c of chunks) {
            all.set(c.subarray(0, Math.min(c.length, size - offset)), offset);
            offset += c.length;
            if (offset >= size)
                break;
        }
        const output = new TextDecoder().decode(all);
        this._log.endTimer(t, 'CALL', {cmd, blocking: false, success: proc.get_successful(),
            timedOut, truncated: size >= maxBytes});
        return output;
    }
}
