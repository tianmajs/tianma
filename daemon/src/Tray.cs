using System;
using System.ComponentModel;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

namespace Alibaba.F2E.Tianma {
	class Tray : EventEmitter, IDisposable {
		// Start menu item.
		MenuItem menuStart;

		// Stop menu item.
		MenuItem menuStop;

		// Restart menu item.
		MenuItem menuRestart;

		// Exit menu item.
		MenuItem menuExit;

		// Config file menu items.
		MenuItem[] menusConfig;

		// Notify icon container.
		IContainer components;

		// Menu container.
		ContextMenu contextMenu;

		// Running status icon.
		Icon runningIcon;

		// Idle status icon.
		Icon stoppedIcon;

		// NotifyIcon instance.
		NotifyIcon notifyIcon;

		// Automatic increased menu item index.
		int menuIndex = 0;

		// Constructor.
		public Tray(string configFile) {
			menuStart = CreateControl("Start");
			menuStop = CreateControl("Stop");
			menuRestart = CreateControl("Restart");
			menuExit = CreateControl("Exit");

			contextMenu = new ContextMenu();
			contextMenu.MenuItems.Add(CreateSwitch(configFile));
			contextMenu.MenuItems.Add("-");
			contextMenu.MenuItems.Add(menuStart);
			contextMenu.MenuItems.Add(menuStop);
			contextMenu.MenuItems.Add(menuRestart);
			contextMenu.MenuItems.Add("-");
			contextMenu.MenuItems.Add(menuExit);

			components = new Container();

			Assembly assembly = Assembly.GetExecutingAssembly();
			runningIcon = new Icon(assembly.GetManifestResourceStream("running.ico"));
			stoppedIcon = new Icon(assembly.GetManifestResourceStream("stopped.ico"));

			notifyIcon = new NotifyIcon(components);
			notifyIcon.Icon = runningIcon;
			notifyIcon.ContextMenu = contextMenu;
			notifyIcon.Visible = true;
		}

		// Destructor
		public void Dispose() {
			components.Dispose();
		}

		// Display balloon message.
		public void Notify(object sender, EventArgsEx args) {
			string type = args.Type;
			string tipTitle;
			string tipText = args.Message;

			switch (type) {
			case "error":
				tipTitle = "Error";
				break;
			case "output": // Fall through.
			default:
				tipTitle = "Information";
				break;
			}

			if (tipText.Length > 196) {
				tipText = tipText.Substring(0, 196) + "...";
			}

			notifyIcon.Visible = true;
			notifyIcon.ShowBalloonTip(20, tipTitle, tipText, ToolTipIcon.None);
		}

		// Refresh UI.
		public void Refresh(object sender, EventArgsEx args) {
			bool running = args.Type == "started";

			menuStart.Enabled = !running;
			menuStop.Enabled = running;
			menuRestart.Enabled = running;

			notifyIcon.Icon = running ?
				runningIcon : stoppedIcon;
			notifyIcon.Text = running ?
				"Tianma HTTP Server (Running)" : "Tianma HTTP Server (Stopped)";
		}

		// Create control menu item.
		MenuItem CreateControl(string text) {
			MenuItem item = new MenuItem();

			item.Text = text;
			item.Index = menuIndex++;
			item.Click += OnControlClicked;

			return item;
		}

		// Create switch menu item.
		MenuItem CreateSwitch(string configFile) {
			MenuItem item = new MenuItem();
			string[] files = Directory.GetFiles(".", "*.js", SearchOption.TopDirectoryOnly);

			item.Text = "Switch";
			item.Index = menuIndex++;

			menusConfig = new MenuItem[files.Length];

			for (int i = 0; i < files.Length; ++i) {
				MenuItem subItem = new MenuItem();

				subItem.Text = Path.GetFileName(files[i]);
				subItem.Index = menuIndex++;
				subItem.RadioCheck = true;
				subItem.Click += OnSwitchClicked;

				if (subItem.Text == configFile) {
					subItem.Checked = true;
				}

				item.MenuItems.Add(subItem);
				menusConfig[i] = subItem;
			}

			return item;
		}

		// Control menu item click event handler.
		void OnControlClicked(object sender, EventArgs args) {
			EmitEvent(((MenuItem)sender).Text.ToLower());
		}

		// Switch menu item click event handler.
		void OnSwitchClicked(object sender, EventArgs args) {
			string text = ((MenuItem)sender).Text;

			foreach (MenuItem item in menusConfig) {
				if (item.Text == text) {
					item.Checked = true;
				} else {
					item.Checked = false;
				}
			}

			EmitEvent("switch", text.ToLower());
		}
	}
}
