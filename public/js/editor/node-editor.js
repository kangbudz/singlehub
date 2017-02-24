/**
 * Created by Derwish (derwish.pro@gmail.com) on 22.01.17.
 */
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "../../nodes/nodes", "../../nodes/container", "./renderer", "./editor-socket", "./node-editor-themes", "../../nodes/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    const nodes_1 = require("../../nodes/nodes");
    const container_1 = require("../../nodes/container");
    const renderer_1 = require("./renderer");
    const editor_socket_1 = require("./editor-socket");
    const node_editor_themes_1 = require("./node-editor-themes");
    const utils_1 = require("../../nodes/utils");
    class NodeEditor {
        constructor() {
            //nodes: Nodes;
            this.isRunning = false;
            this.showSlotsValues = false;
            //fill container
            let html = "<div class='content'><div class='editor-area'><canvas class='canvas' width='1000' height='500' tabindex=10></canvas></div></div>";
            let root = document.createElement("div");
            this.root = root;
            root.className = "node-editor";
            root.innerHTML = html;
            let canvas = root.querySelector(".canvas");
            //nodes options theme
            if (window.theme)
                nodes_1.Nodes.options = node_editor_themes_1.themes[window.theme];
            //create root container
            this.rootContainer = new container_1.Container();
            //create socket
            this.socket = editor_socket_1.socket;
            this.rootContainer.socket = editor_socket_1.socket.socket;
            //create canvas
            let renderer = this.renderer = new renderer_1.Renderer(canvas, this.rootContainer);
            // renderer.background_image = "/images/node-editor/grid.png";
            this.rootContainer.onAfterExecute = function () {
                renderer.draw(true);
            };
            //todo later
            //  this.addMiniWindow(200, 200);
            //append to DOM
            let parent = document.getElementById("main");
            if (parent)
                parent.appendChild(root);
            renderer.resize();
            //renderer.draw(true,true);
            this.addFullscreenButton();
            this.addPlayButton();
            this.addStepButton();
            this.addSlotsValuesButton();
            this.updateContainersNavigation();
        }
        addMiniWindow(w, h) {
            if (minimap_opened)
                return;
            minimap_opened = true;
            let miniwindow = document.createElement("div");
            miniwindow.className = "miniwindow";
            miniwindow.innerHTML = "<canvas class='canvas' width='" + w + "' height='" + h + "' tabindex=10></canvas>";
            let canvas = miniwindow.querySelector("canvas");
            let renderer = new renderer_1.Renderer(canvas, this.rootContainer);
            //  renderer.background_image = "images/node-editor/grid.png";
            //derwish edit
            renderer.scale = 0.1;
            //renderer.allow_dragnodes = false;
            renderer.offset = [0, 0];
            renderer.scale = 0.1;
            renderer.setZoom(0.1, [1, 1]);
            miniwindow.style.position = "absolute";
            miniwindow.style.top = "4px";
            miniwindow.style.right = "4px";
            let close_button = document.createElement("div");
            close_button.className = "corner-button";
            close_button.innerHTML = "X";
            close_button.addEventListener("click", function (e) {
                minimap_opened = false;
                renderer.setContainer(null, false, false);
                miniwindow.parentNode.removeChild(miniwindow);
            });
            miniwindow.appendChild(close_button);
            //derwiah added
            let reset_button = document.createElement("div");
            reset_button.className = "corner-button2";
            reset_button.innerHTML = "R";
            reset_button.addEventListener("click", function (e) {
                renderer.offset = [0, 0];
                renderer.scale = 0.1;
                renderer.setZoom(0.1, [1, 1]);
            });
            miniwindow.appendChild(reset_button);
            this.root.querySelector(".content").appendChild(miniwindow);
        }
        addFullscreenButton() {
            $("#fullscreen-button").click(function () {
                // editor.goFullscreen();
                let elem = document.documentElement;
                let fullscreenElement = document.fullscreenElement ||
                    document.mozFullscreenElement ||
                    document.webkitFullscreenElement;
                if (fullscreenElement == null) {
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen();
                    }
                    else if (elem.mozRequestFullScreen) {
                        elem.mozRequestFullScreen();
                    }
                    else if (elem.webkitRequestFullscreen) {
                        elem.webkitRequestFullscreen();
                    }
                }
                else {
                    if (document.cancelFullScreen) {
                        document.cancelFullScreen();
                    }
                    else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    }
                    else if (document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    }
                }
            });
        }
        importContainerFromFile(position) {
            $('#import-panel-title').html("Import Container");
            $('#import-panel-body').show();
            $('#import-panel-message').hide();
            //clear upload file
            let uploadFile = $("#uploadFile");
            uploadFile.replaceWith(uploadFile = uploadFile.clone(true));
            $('#import-panel').modal({
                dimmerSettings: { opacity: 0.3 }
            }).modal('setting', 'transition', 'fade up').modal('show');
            document.forms['uploadForm'].elements['uploadFile'].onchange = function (evt) {
                $('#import-panel-message').html("Uploading...");
                $('#import-panel-message').show();
                $('#import-panel-body').hide();
                if (!window.FileReader) {
                    $('#import-panel-message').html("Browser is not compatible");
                    $('#import-panel-message').show();
                    $('#import-panel-body').hide();
                }
                let reader = new FileReader();
                reader.onload = function (evt) {
                    if (evt.target.readyState != 2)
                        return;
                    if (evt.target.error) {
                        $('#import-panel-message').html("Error while reading file.");
                        $('#import-panel-message').show();
                        $('#import-panel-body').hide();
                        return;
                    }
                    let filebody = evt.target.result;
                    $.ajax({
                        url: "/api/editor/ImportContainerJson/",
                        type: "POST",
                        data: {
                            json: filebody,
                            x: position[0],
                            y: position[1],
                            ownerContainerId: 0
                        },
                        success: function (result) {
                            if (result) {
                                $('#import-panel').modal('hide');
                            }
                            else {
                                $('#import-panel-message').html("Error. File format is not correct.");
                                $('#import-panel-message').show();
                                $('#import-panel-body').hide();
                            }
                        }
                    });
                };
                reader.readAsText(evt.target.files[0]);
            };
        }
        importContainerFromScript(position) {
            $('#modal-panel-submit').show();
            $('#modal-panel-title').html("Import Container");
            $('#modal-panel-form').html('<div class="field">' +
                'Script: <textarea id="modal-panel-text"></textarea>' +
                '</div>');
            $('#modal-panel').modal({
                dimmerSettings: { opacity: 0.3 },
                onHidden: function () {
                    $('#modal-panel-submit').hide();
                    $('#modal-panel-message').hide();
                    $('#modal-panel-message').removeClass("negative");
                    $('#modal-panel-form').removeClass("loading");
                    $('#modal-panel-submit').unbind();
                }
            }).modal('setting', 'transition', 'fade up').modal('show');
            $('#modal-panel-submit').click(function () {
                $('#modal-panel-form').addClass("loading");
                $('#modal-panel-message').html("Uploading...");
                $('#modal-panel-message').removeClass("negative");
                $('#modal-panel-message').fadeIn(300);
                // $('#import-script-body').hide();
                $.ajax({
                    url: "/api/editor/ImportContainerJson/",
                    type: "POST",
                    data: {
                        json: $('#modal-panel-text').val(),
                        x: position[0],
                        y: position[1],
                        ownerContainerId: 0
                    },
                    success: function (result) {
                        if (result) {
                            $('#modal-panel').modal('hide');
                        }
                        else {
                            $('#modal-panel-message').html("Failed to import. Script is not correct.");
                            $('#modal-panel-message').addClass("negative");
                            $('#modal-panel-form').removeClass("loading");
                            $('#modal-panel-message').show();
                            $('#modal-panel-body').fadeIn(300);
                        }
                    }
                });
            });
        }
        importContainerFromURL(position) {
            $('#modal-panel-submit').show();
            $('#modal-panel-title').html("Import Container");
            $('#modal-panel-form').html('<div class="field">' +
                'URL:  <input type="text" id="modal-panel-text">' +
                '</div>');
            $('#modal-panel').modal({
                dimmerSettings: { opacity: 0.3 },
                onHidden: function () {
                    $('#modal-panel-submit').hide();
                    $('#modal-panel-message').hide();
                    $('#modal-panel-message').removeClass("negative");
                    $('#modal-panel-form').removeClass("loading");
                    $('#modal-panel-submit').unbind();
                }
            }).modal('setting', 'transition', 'fade up').modal('show');
            $('#modal-panel-submit').click(function () {
                $('#modal-panel-form').addClass("loading");
                $('#modal-panel-message').html("Importing...");
                $('#modal-panel-message').removeClass("negative");
                $('#modal-panel-message').fadeIn(300);
                // $('#import-script-body').hide();
                let script;
                let url = $('#modal-panel-text').val();
                $.ajax({
                    url: url,
                    type: "POST",
                    success: function (result) {
                        script = result;
                        importContainer(script);
                    },
                    error: function (result) {
                        $('#modal-panel-form').removeClass("loading");
                        $('#modal-panel-message').addClass("negative");
                        $('#modal-panel-message').html("Error loading data. URL is incorrect.");
                        $('#modal-panel-message').show();
                    }
                });
                function importContainer(script) {
                    $.ajax({
                        url: "/api/editor/ImportContainerJson/",
                        type: "POST",
                        data: {
                            json: script,
                            x: position[0],
                            y: position[1],
                            ownerContainerId: 0
                        },
                        success: function (result) {
                            if (result) {
                                $('#modal-panel').modal('hide');
                            }
                            else {
                                $('#modal-panel-message').html("Failed to import.  Downloaded data is not correct.");
                                $('#modal-panel-message').addClass("negative");
                                $('#modal-panel-form').removeClass("loading");
                                $('#modal-panel-message').show();
                                $('#modal-panel-body').fadeIn(300);
                            }
                        }
                    });
                }
            });
        }
        exportContainerToScript(id) {
            $('#modal-panel-message').html("Generating script...");
            $('#modal-panel-message').fadeIn(300);
            $('#modal-panel-title').html("Export Container");
            $('#modal-panel-form').html('<div class="field">' +
                'Script: <textarea id="modal-panel-text"></textarea>' +
                '</div>');
            $('#modal-panel-text').hide();
            $('#modal-panel').modal({
                dimmerSettings: { opacity: 0.3 },
                onHidden: function () {
                    $('#modal-panel-message').hide();
                }
            }).modal('setting', 'transition', 'fade up').modal('show');
            $.ajax({
                url: "/api/editor/serialize-container/",
                type: "POST",
                data: { id: id },
                success: function (result) {
                    $('#modal-panel-text').html(result);
                    $('#modal-panel-text').fadeIn(300);
                    $('#modal-panel-message').hide();
                }
            });
        }
        exportContainerURL(id) {
            $('#modal-panel-title').html("Export Container");
            $('#modal-panel-form').html('<div class="field">' +
                'URL:  <input type="text" id="modal-panel-text">' +
                '</div>');
            let url = $(location).attr('host') + "/api/editor/serialize-container/" + id;
            let prefix = 'http://';
            if (url.substr(0, prefix.length) !== prefix) {
                url = prefix + url;
            }
            $('#modal-panel-text').val(url);
            $('#modal-panel').modal({
                dimmerSettings: { opacity: 0.3 },
                onHidden: function () {
                }
            }).modal('setting', 'transition', 'fade up').modal('show');
        }
        showNodeDescription(node) {
            $('#modal-panel-title').html(node.type);
            $('#modal-panel-form').html('<div class="field">' + node.descriprion + '</div>');
            $('#modal-panel-buttons').html('<a href="/editor/nodes-description" class="ui button">Show all nodes</a>' +
                '<div class="ui cancel button">Cancel</div>');
            $('#modal-panel').modal({
                dimmerSettings: { opacity: 0.3 },
                onHidden: function () {
                }
            }).modal('setting', 'transition', 'fade up').modal('show');
        }
        showNodeSettings(node) {
            $('#node-settings-title').html(node.type);
            //clear old body
            let body = $('#node-settings-body');
            body.empty();
            //add setting-elements from templates
            for (let s in node.settings) {
                if (!node.settings[s].type || node.settings[s].type == "string") {
                    body.append(textSettingTemplate({ settings: node.settings[s], key: s }));
                    continue;
                }
                switch (node.settings[s].type) {
                    case "number":
                        body.append(numberSettingTemplate({ settings: node.settings[s], key: s }));
                        break;
                    case "boolean":
                        body.append(checkboxSettingTemplate({ settings: node.settings[s], key: s }));
                        if (node.settings[s].value)
                            $('#node-setting-' + s).prop('checked', true);
                        break;
                    case "dropdown":
                        let settings = utils_1.default.cloneObject(node.settings[s]);
                        //set selected element
                        for (let el of settings.config.elements)
                            if (el.key == settings.value)
                                el.selected = true;
                        body.append(dropdownSettingTemplate({ settings: settings, key: s }));
                        $('.ui.dropdown').dropdown();
                        break;
                }
            }
            //modal panel
            $('#node-settings-panel').modal({
                dimmerSettings: { opacity: 0.3 },
                onApprove: function () {
                    //get settings from form
                    let data = [];
                    for (let s in node.settings) {
                        if (!node.settings[s].type || node.settings[s].type == "string") {
                            data.push({ key: s, value: $('#node-setting-' + s).val() });
                            continue;
                        }
                        switch (node.settings[s].type) {
                            case "number":
                                data.push({ key: s, value: $('#node-setting-' + s).val() });
                                break;
                            case "boolean":
                                data.push({ key: s, value: $('#node-setting-' + s).prop('checked') ? "true" : "false" });
                                break;
                            case "dropdown":
                                data.push({ key: s, value: $('#node-setting-' + s).val() });
                                break;
                        }
                    }
                    console.log(data);
                    //send settings
                    $.ajax({
                        url: "/api/editor/c/" + node.container.id + "/n/" + node.id + "/settings",
                        type: "PUT",
                        contentType: 'application/json',
                        data: JSON.stringify(data)
                    });
                }
            }).modal('setting', 'transition', 'fade up').modal('show');
        }
        addPlayButton() {
            var that = this;
            $("#play-button").click(function () {
                if (that.isRunning)
                    editor_socket_1.socket.sendStopContainer();
                else
                    editor_socket_1.socket.sendRunContainer();
            });
        }
        addStepButton() {
            $("#step-button").click(function () {
                editor_socket_1.socket.sendStepContainer();
                // container.runStep();
            });
        }
        onContainerRun() {
            this.isRunning = true;
            $("#step-button").fadeTo(200, 0.3);
            $("#play-icon").addClass("stop");
            $("#play-icon").removeClass("play");
        }
        onContainerRunStep() {
            if (this.showSlotsValues)
                editor_socket_1.socket.sendGetSlotsValues();
        }
        onContainerStop() {
            this.isRunning = false;
            $("#step-button").fadeTo(200, 1);
            $("#play-icon").removeClass("stop");
            $("#play-icon").addClass("play");
        }
        addSlotsValuesButton() {
            let that = this;
            $("#slots-values-button").click(function () {
                that.showSlotsValues = !that.showSlotsValues;
                if (that.showSlotsValues) {
                    $("#slots-values-icon").addClass("hide");
                    $("#slots-values-icon").removeClass("unhide");
                    that.socket.sendGetSlotsValues();
                }
                else {
                    $("#slots-values-icon").removeClass("hide");
                    $("#slots-values-icon").addClass("unhide");
                    let container = that.renderer.container;
                    for (let id in container._nodes) {
                        let node = container._nodes[id];
                        node.updateInputsLabels();
                        node.updateOutputsLabels();
                    }
                }
            });
        }
        updateNodesLabels() {
            if (this.showSlotsValues)
                this.socket.sendGetSlotsValues();
            else {
                let container = this.renderer.container;
                for (let id in container._nodes) {
                    let node = container._nodes[id];
                    node.updateInputsLabels();
                    node.updateOutputsLabels();
                }
            }
        }
        updateContainersNavigation() {
            let that = this;
            $("#containers-navigation").html("");
            addendButton(0, "Main");
            //if this is a sub-container
            if (this.renderer._containers_stack
                && this.renderer._containers_stack.length > 0) {
                //add containers
                let cont_count = this.renderer._containers_stack.length;
                for (let cont = 1; cont < cont_count; cont++) {
                    let cont_name = this.renderer._containers_stack[cont].container_node.title;
                    let cont_id = this.renderer._containers_stack[cont].id;
                    addendButton(cont_id, cont_name);
                }
                //add this container
                let cont_name = this.renderer.container.container_node.title;
                let cont_id = this.renderer.container.id;
                addendButton(cont_id, cont_name);
            }
            function addendButton(cont_id, cont_name) {
                $("#containers-navigation")
                    .append(`<div id="container${cont_id}" class="ui black tiny compact button">${cont_name}</div>`);
                $("#container" + cont_id).click(function () {
                    for (let i = 0; i < 1000; i++) {
                        if (that.renderer.container.id == cont_id)
                            break;
                        that.renderer.closeContainer(false);
                    }
                    that.socket.sendJoinContainerRoom(that.renderer.container.id);
                    exports.editor.updateNodesLabels();
                });
            }
        }
        updateBrowserUrl() {
            //change browser url
            let cid = exports.editor.renderer.container.id;
            if (cid == 0)
                window.history.pushState('Container ' + cid, 'MyNodes', '/editor/');
            else
                window.history.pushState('Container ' + cid, 'MyNodes', '/editor/c/' + cid);
        }
    }
    exports.NodeEditor = NodeEditor;
    let minimap_opened = false;
    // noty settings
    $.noty.defaults.layout = 'bottomRight';
    $.noty.defaults.theme = 'relax';
    $.noty.defaults.timeout = 3000;
    $.noty.defaults.animation = {
        open: 'animated bounceInRight',
        close: 'animated flipOutX',
        easing: 'swing',
        speed: 500 // unavailable - no need
    };
    //setting-elements templates
    let textSettingTemplate = Handlebars.compile($('#textSettingTemplate').html());
    let numberSettingTemplate = Handlebars.compile($('#numberSettingTemplate').html());
    let checkboxSettingTemplate = Handlebars.compile($('#checkboxSettingTemplate').html());
    let dropdownSettingTemplate = Handlebars.compile($('#dropdownSettingTemplate').html());
    exports.editor = new NodeEditor();
});
//# sourceMappingURL=node-editor.js.map