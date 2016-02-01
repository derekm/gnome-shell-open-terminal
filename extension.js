
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

function init() {
    Convenience.initTranslations("gnome-shell-open-terminal");
}

function reloadLayout() {
    LayoutManager._bgManagers.forEach(
        function(mgr) {
            if (!mgr.background)
                mgr.emit('changed');
            else // < gnome-shell-3.12?
                mgr.background.emit('changed');
        });
}

function enable() {
    // patch PopupMenu
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

    // patch BackgroundMenu
    BackgroundMenu.BackgroundMenu.prototype._old_init = BackgroundMenu.BackgroundMenu.prototype._init;
    BackgroundMenu.BackgroundMenu.prototype._init = function(source) {
        this._old_init(source);
        this.actor.add_style_class_name('popup-menu-box');
        //this.addAppAction(_("Open Terminal"), 'gnome-terminal.desktop', 0);
        this.addAppAction(_("Open Terminal"), 'org.gnome.Terminal.desktop', 0);
    };

    reloadLayout();
}

function disable() {
    BackgroundMenu.BackgroundMenu.prototype._init = BackgroundMenu.BackgroundMenu.prototype._old_init;
    BackgroundMenu.BackgroundMenu.prototype._old_init = undefined;
    PopupMenu.PopupMenu.prototype.addAppAction = undefined;
    PopupMenu.PopupMenu.prototype.addActionAt = undefined;

    reloadLayout();
}
