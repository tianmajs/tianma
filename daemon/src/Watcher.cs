using System.IO;

namespace Alibaba.F2E.Tianma {
	class Watcher : EventEmitter {
		// FileSystemWatcher instance.
		FileSystemWatcher watcher;

		// Constructor.
		public Watcher(string config) {
			watcher = new FileSystemWatcher();

			watcher.Path = ".";
			watcher.Filter = config;
			watcher.Changed += OnChanged;
			watcher.EnableRaisingEvents = true;
		}

		// Switch watching target.
		public void Switch(object sender, EventArgsEx args) {
			watcher.Filter = args.Message;
		}

		// Change event handler.
		void OnChanged(object sender, FileSystemEventArgs args) {
			EmitEvent("change", "\"" + watcher.Filter + "\" changed.");
		}
	}
}
