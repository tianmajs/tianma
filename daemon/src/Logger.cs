using System;
using System.IO;

namespace Alibaba.F2E.Tianma {
	class Logger: EventEmitter, IDisposable {
		// Log directory path.
		const string DIR_NAME = ".log";

		// Log file writer.
		StreamWriter writer;

		// Constructor.
		public Logger() {
			Open();
		}

		// Destructor
		public void Dispose() {
			Close();
		}

		// Write to file.
		public void Write(object sender, EventArgsEx args) {
			string message = args.Message;

			if (!String.IsNullOrEmpty(message)) {
				writer.Write(message);
			}
		}

		// Close file.
		void Close() {
			writer.Close();
		}

		// Open file.
		void Open() {
			DateTime now = DateTime.Now;
			string fileName = String.Format("{0}-{1:00}-{2:00}.log",
				now.Year, now.Month, now.Day);

			if (!Directory.Exists(DIR_NAME)) {
				Directory.CreateDirectory(DIR_NAME);
			}

			writer = new StreamWriter(Path.Combine(DIR_NAME, fileName));
			writer.AutoFlush = true;
		}
	}
}