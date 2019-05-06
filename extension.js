
const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const PopupMenu = imports.ui.popupMenu;
const LayoutManager = imports.ui.main.layoutManager;
const BackgroundMenu = imports.ui.backgroundMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Gettext = imports.gettext.domain('gnome-shell-open-terminal');
const _ = Gettext.gettext;

function init(extensionMeta) {
    return new OpenTerminalExtension(extensionMeta);
}

class OpenTerminalExtension {
    constructor(extensionMeta) {
        Convenience.initTranslations("gnome-shell-open-terminal");
    }

    enable() {
        PopupMenu.PopupMenu.prototype.addActionAt = function(title, position, callback) {
            let menuItem = new PopupMenu.PopupMenuItem(title);
            this.addMenuItem(menuItem, position);
            menuItem.connect('activate', Lang.bind(this, function(menuItem, event) {
                callback(event);
            }));
            return menuItem;
        };

        PopupMenu.PopupMenu.prototype.addAppAction = function(title, desktopFile, position) {
            let menuItem = this.addActionAt(title, position, function(event) {
                let app = Shell.AppSystem.get_default().lookup_app(desktopFile);
                if (!app) {
                    log('Application for desktop file ' + desktopFile + ' could not be found!');
                    return;
                }
                Main.overview.hide();
                app.open_new_window(-1);
            });
            menuItem.actor.visible = true;
            return menuItem;
        };

        LayoutManager._bgManagers.forEach(
            function(mgr) {
                let actor = mgr.backgroundActor;
                actor._backgroundMenu.addAppAction(_("Open Terminal"), 'org.gnome.Terminal.desktop', 0);
                actor._backgroundManager.addMenu(actor._backgroundMenu);
            }
        );
    }

    disable() {
        LayoutManager._bgManagers.forEach(
            function(mgr) {
                let actor = mgr.backgroundActor;
                actor._backgroundMenu.destroy();
                BackgroundMenu.addBackgroundMenu(actor, LayoutManager);
            }
        );
        PopupMenu.PopupMenu.prototype.addAppAction = undefined;
        PopupMenu.PopupMenu.prototype.addActionAt = undefined;
    }
}
