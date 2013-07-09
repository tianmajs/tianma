using System;
using System.Diagnostics;
using System.IO;
using System.Timers;
using System.Threading;

namespace Alibaba.F2E.Tianma {
	class Node : EventEmitter {
		// Process status constants.
		enum Status { Idle, Starting, Running, Stopping }

		// Standard error buffer.
		string error = "";

		// Standard output buffer.
		string output = "";

		// Node process instance.
		Process process = null;

		// Node process start info.
		ProcessStartInfo startInfo;

		// Current process status.
		Status status;

		// Flush timer.
		System.Timers.Timer timer;

		// Singleton check.
		public static bool IsRunning() {
			bool result = false;

			if (File.Exists(".pid")) {
				try {
					// Try to find running process by previous saved pid.
					Process process = Process.GetProcessById(Convert.ToInt32(File.ReadAllText(".pid")));
					if (process.MainModule.ModuleName == "node.exe") {
						result = true;
					}
				} catch (Exception ex) {
					// Depress compiling warning.
					Exception dummy = ex;
				}
			}

			return result;
		}

		// Constructor.
		public Node(string config) {
			timer = new System.Timers.Timer();
			timer.Interval = 100;
			timer.Elapsed += Flush;

			startInfo = new ProcessStartInfo();

			startInfo.FileName = FindExec("node.exe");
			startInfo.Arguments = "\"" + config + "\"";
			startInfo.CreateNoWindow = true;
			startInfo.UseShellExecute = false;
			startInfo.RedirectStandardError = true;
			startInfo.RedirectStandardInput = true;
			startInfo.RedirectStandardOutput = true;

			SetEV();

			AddHandler("start", Start);
			AddHandler("stop", Stop);
		}

		// Restart process.
		public void Restart(object sender, EventArgsEx args) {
			if (args.Type == "switch") {
				startInfo.Arguments = "\"" + args.Message + "\"";
			}

			if (status == Status.Running) {
				// Stop current process and start a new process immediately.
				status = Status.Stopping;
				process.Exited += Start;
				process.Kill();
			} else if (status == Status.Idle) {
				EmitEvent("start");
			}
		}

		// Start process.
		public void Start(object sender, EventArgs args) {
			if (status == Status.Idle) {
				status = Status.Starting;

				process = new Process();
				process.StartInfo = startInfo;
				process.EnableRaisingEvents = true;
				process.ErrorDataReceived += OnError;
				process.OutputDataReceived += OnOutput;
				process.Exited += OnExit;

				process.Start();
				process.PriorityClass = ProcessPriorityClass.High;
				process.BeginErrorReadLine();
				process.BeginOutputReadLine();

				// Save current PID.
				File.WriteAllText(".pid", String.Format("{0}", process.Id));

				status = Status.Running;
			}

			if (status == Status.Running) {
				EmitEvent("started");
			}
		}

		// Stop process.
		public void Stop(object sender, EventArgs args) {
			if (status == Status.Running) {
				status = Status.Stopping;
				process.Kill();
			} else if (status == Status.Idle) {
				EmitEvent("stopped");
			}
		}

		// Get command result synchronously.
		string Command(string exec, string arguments) {
			Process process = new System.Diagnostics.Process();

			process.StartInfo.FileName = FindExec(exec);
			process.StartInfo.Arguments = arguments;
			process.StartInfo.CreateNoWindow = true;
			process.StartInfo.UseShellExecute = false;
			process.StartInfo.RedirectStandardOutput = true;
			process.StartInfo.RedirectStandardError = true;
			process.Start();

			string output = process.StandardOutput.ReadToEnd().Trim();

			process.WaitForExit();
			process.Close();

			return output;
		}

		// Find pathname of executable file.
		string FindExec(string name) {
			string path = Environment.GetEnvironmentVariable("PATH");

			foreach (string folder in path.Split(new char[] { ';' })) {
				string exec = Path.Combine(folder.Trim(), name);
				if (File.Exists(exec)) {
					return exec;
				}
			}

			return "";
		}

		// Flush buffer.
		void Flush(object sender, ElapsedEventArgs args) {
			if (!timer.Enabled) {
				return;
			} else if (output.Length > 0) {
				EmitEvent("output", output);
				output = "";
			} else if (error.Length > 0) {
				EmitEvent("error", error);
				error = "";
			}
		}

		// Setup enviroment variables.
		void SetEV() {
			Environment.SetEnvironmentVariable("NODE_PATH", Command("tianma.cmd", "libpath"));
		}

		// Standard error event handler.
		void OnError(object sender, DataReceivedEventArgs args) {
			if (!String.IsNullOrEmpty(args.Data)) {
				timer.Stop();
				error += args.Data + "\n";
				timer.Start();
			}
		}

		// Exit event handler.
		void OnExit(object sender, EventArgs args) {
			process.CancelErrorRead();
			process.CancelOutputRead();
			process.Close();

			status = Status.Idle;
			EmitEvent("stopped");
		}

		// Standard output event handler.
		void OnOutput(object sender, DataReceivedEventArgs args) {
			if (!String.IsNullOrEmpty(args.Data)) {
				timer.Stop();
				output += args.Data + "\n";
				timer.Start();
			}
		}
	}
}
