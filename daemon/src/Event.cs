using System;
using System.Collections.Generic;

namespace Alibaba.F2E.Tianma {
	delegate void EventHandlerEx(object sender, EventArgsEx args);

	class EventArgsEx : EventArgs {
		string message;

		string type;

		// Event message.
		public string Message {
			get { return message; }
		}

		// Event type.
		public string Type {
			get { return type; }
		}

		// Constructor.
		public EventArgsEx(string type, string message) {
			this.type = type;
			this.message = message;
		}
	}

	class EventEmitter {
		// Type -> Handlers map.
		Dictionary<string, EventHandlerEx> events;

		// Constructor.
		public EventEmitter() {
			events = new Dictionary<string, EventHandlerEx>();
		}

		// Add an event handler.
		public void AddHandler(string type, EventHandlerEx handler) {
			if (!events.ContainsKey(type)) {
				events[type] = handler;
			} else {
				events[type] += handler;
			}
		}

		// Remove an event handler.
		public void RemoveHandler(string type, EventHandlerEx handler) {
			if (events.ContainsKey(type)) {
				events[type] -= handler;
				if (events[type] == null) {
					events.Remove(type);
				}
			}
		}

		// Emit an event.
		public void EmitEvent(string type, string message) {
			if (events.ContainsKey(type)) {
				events[type](this, new EventArgsEx(type, message));
			}
		}

		// Emit an event without message.
		public void EmitEvent(string type) {
			EmitEvent(type, "");
		}
	}
}
