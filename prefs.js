
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const GMenu = imports.gi.GMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var bldr;
var pane;
var tree;
var root;

var icons;
var items;

function init() {
    let prefs = Me.path + '/prefs.xml';
    bldr = new Gtk.Builder();
    bldr.add_from_file(prefs);

    tree = new GMenu.Tree({
        menu_basename: "applications.menu",
        flags: GMenu.TreeFlags.SORT_DISPLAY_NAME
    });
    tree.load_sync();
    root = tree.get_root_directory();
}

function buildIconView(dir) {
    if (dir == undefined)
        var iter = root.iter();
    else
        var iter = dir.iter();

    let nextType;
    while ((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
        if (nextType == GMenu.TreeItemType.DIRECTORY)
            buildIconView(iter.get_directory());
        else if (nextType == GMenu.TreeItemType.ENTRY) {
            let entry = iter.get_entry();
            let appInfo = entry.get_app_info();
            let appIcon = appInfo.get_icon();
            if (appIcon == null)
                continue;
            let id = entry.get_desktop_file_id();
            let label = appInfo.get_name();
            let theme = Gtk.IconTheme.get_default();
            let gicon = theme.lookup_by_gicon(appIcon, 32,
                    Gtk.IconLookupFlags.GENERIC_FALLBACK);
            if (gicon == null)
                continue;
            let icon = gicon.load_icon();
            let store = icons.append();
            icons.set_value(store, 0, icon);
            icons.set_value(store, 1, label);
            icons.set_value(store, 2, id);
        }
    }
}

function addToTreeView(iconview, path, user_data) {
    let selection = iconview.get_selected_items()[0];
    let iter = icons.get_iter(selection)[1];
    let icon = icons.get_value(iter, 0);
    let label = icons.get_value(iter, 1);
    let id = icons.get_value(iter, 2);
    let store = items.append();
    items.set_value(store, 0, icon);
    items.set_value(store, 1, label);
    items.set_value(store, 2, id);
}

function buildPrefsWidget() {
    pane = bldr.get_object('paned1');
    icons = bldr.get_object('liststore1');
    items = bldr.get_object('liststore2');

    let iconview = bldr.get_object('iconview1');
    iconview.set_pixbuf_column(0);
    iconview.set_text_column(1);
    iconview.connect('item-activated', Lang.bind(this, addToTreeView));

    buildIconView();
    //buildPopupView();

    let treeview = bldr.get_object('treeview1');

    let iconCol = new Gtk.TreeViewColumn({title: "Icon"});
    let iconCell = new Gtk.CellRendererPixbuf({xalign: 0.25, yalign: 0.25});
    iconCol.pack_start(iconCell, true);
    iconCol.add_attribute(iconCell, "pixbuf", 0);
    treeview.append_column(iconCol);

    let labelCol = new Gtk.TreeViewColumn({title: "Label"});
    let labelCell = new Gtk.CellRendererText({editable: true});
    labelCol.pack_start(labelCell, true);
    labelCol.add_attribute(labelCell, "text", 1);
    treeview.append_column(labelCol);

    return pane;
}
