/**
 * Tianma Daemon
 * Copyright(c) 2013 Alibaba.Com, Inc.
 * MIT Licensed
 */

using System;
using System.Windows.Forms;

namespace Alibaba.F2E.Tianma {
	class App : ApplicationContext {
		// Process control.
		Node node;

		// Tray control.
		Tray tray;

		// File watcher.
		Watcher watcher;

		// Application entrance.
		public static void Main(string[] args) {
			if (!Node.IsRunning()) { // Singleton check.
				Application.EnableVisualStyles();
				Application.Run(new App(args.Length > 0 ? args[0] : "config.js"));
			}
		}

		// Constructor.
		public App(string config) {
			tray = new Tray(config);
			node = new Node(config);
			watcher = new Watcher(config);

			tray.AddHandler("start", node.Start);
			tray.AddHandler("stop", node.Stop);
			tray.AddHandler("restart", node.Restart);
			tray.AddHandler("switch", node.Restart);
			tray.AddHandler("switch", watcher.Switch);
			tray.AddHandler("exit", StopNode);

			node.AddHandler("started", tray.Refresh);
			node.AddHandler("stopped", tray.Refresh);
			node.AddHandler("output", tray.Notify);
			node.AddHandler("error", tray.Notify);

			watcher.AddHandler("change", node.Restart);
			watcher.AddHandler("change", tray.Notify);

			node.EmitEvent("start");
		}

		// Stop node process.
		void StopNode(object sender, EventArgs args) {
			node.AddHandler("stopped", Exit);
			node.EmitEvent("stop");
		}

		// Terminate application.
		void Exit(object sender, EventArgs args) {
			tray.Dispose();
			ExitThread();
		}
	}
}
