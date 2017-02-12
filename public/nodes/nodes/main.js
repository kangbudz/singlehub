/**
 * Created by Derwish (derwish.pro@gmail.com) on 04.07.2016.
 */
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "../nodes", "../node", "../container", "../utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    // namespace MyNodes {
    // let debug = require('debug')('nodes:            ');
    // let debugLog = require('debug')('nodes:log         ');
    // let debugMes = require('debug')('modes:mes         ');
    // let debugErr = require('debug')('nodes:error       ');
    const nodes_1 = require("../nodes");
    const node_1 = require("../node");
    const container_1 = require("../container");
    const utils_1 = require("../utils");
    //Constant
    class ConstantNode extends node_1.Node {
        constructor() {
            super();
            this.setValue = function (v) {
                if (typeof (v) == "string")
                    v = parseFloat(v);
                this.properties["value"] = v;
            };
            this.onExecute = function () {
                this.setOutputData(0, parseFloat(this.properties["value"]));
            };
            this.onDrawBackground = function (ctx) {
                //show the current value
                let val = utils_1.default.formatAndTrimValue(this.properties["value"]);
                this.outputs[0].label = val;
            };
            this.onWidget = function (e, widget) {
                if (widget.name == "value")
                    this.setValue(widget.value);
            };
            this.title = "Constant";
            this.desc = "Constant value";
            this.addOutput("value", "number");
            this.properties = { value: 1.0 };
            this.editable = { property: "value", type: "number" };
        }
    }
    exports.ConstantNode = ConstantNode;
    nodes_1.Nodes.registerNodeType("main/constant", ConstantNode);
    //Container: a node that contains a container of other nodes
    class ContainerNode extends node_1.Node {
        constructor() {
            super();
            this.onAdded = function () {
                this.sub_container.parent_container_id = this.container.id;
            };
            this.onRemoved = function () {
                delete container_1.Container.containers[this.sub_container.id];
            };
            this.getExtraMenuOptions = function (renderer) {
                let that = this;
                return [{
                        content: "Open", callback: function () {
                            renderer.openContainer(that.sub_container);
                        }
                    }];
            };
            this.onExecute = function () {
                // //send inputs to sub_container global inputs
                // if (this.inputs)
                //     for (let i = 0; i < this.inputs.length; i++) {
                //         let input = this.inputs[i];
                //         let value = this.getInputData(i);
                //         this.sub_container.container_node.setContainerInputData(input.name, value);
                //     }
                //execute
                this.sub_container.runStep();
                // //send sub_container global outputs to outputs
                // if (this.outputs)
                //     for (let i = 0; i < this.outputs.length; i++) {
                //         let output = this.outputs[i];
                //         let value = this.sub_container.container_node.getContainerOutputData(output.name);
                //         this.setOutputData(i, value);
                //     }
            };
            this.onGetMessageFromBackSide = function (mes) {
                if (mes.message == "add-output") {
                    this.container_outputs[mes.output.name] = {
                        name: mes.output.name, type: mes.output.type
                    };
                    this.addOutput(mes.output.name, mes.output.type);
                }
            };
            this.title = "Container";
            this.desc = "Contain other nodes";
            this.size = [120, 20];
            this.sub_container = new container_1.Container();
            this.sub_container.container_node = this;
        }
        configure(o) {
            node_1.Node.prototype.configure.call(this, o);
            //this.sub_container.configure(o.container);
        }
        serialize() {
            let data = node_1.Node.prototype.serialize.call(this);
            data.sub_container = this.sub_container.serialize();
            return data;
        }
        clone() {
            let node = nodes_1.Nodes.createNode(this.type);
            let data = this.serialize();
            delete data["id"];
            delete data["inputs"];
            delete data["outputs"];
            node.configure(data);
            return node;
        }
        //rename the global input
        // renameContainerInput(old_name, name) {
        //     if (name == old_name)
        //         return;
        //
        //     if (!this.container_inputs[old_name])
        //         return false;
        //
        //     if (this.container_inputs[name]) {
        //         console.error("there is already one input with that name");
        //         return false;
        //     }
        //
        //     this.container_inputs[name] = this.container_inputs[old_name];
        //     delete this.container_inputs[old_name];
        //
        //     let slot = this.findInputSlot(old_name);
        //     if (slot == -1)
        //         return;
        //     let info = this.getInputInfo(slot);
        //     info.name = name;
        // }
        // changeConainerInputType(name, type) {
        //     if (!this.container_inputs[name])
        //         return false;
        //
        //     if (this.container_inputs[name].type.toLowerCase() == type.toLowerCase())
        //         return;
        //
        //     this.container_inputs[name].type = type;
        //
        //     let slot = this.findInputSlot(name);
        //     if (slot == -1)
        //         return;
        //     let info = this.getInputInfo(slot);
        //     info.type = type;
        // }
        addContainerOutput(out_node) {
            // this.container_outputs[out_node.properties.name] = out_node;
            // this.addOutput(out_node.properties.name, out_node.properties.type);
            // this.sendMessageToFrontSide({
            //     message: "add-output",
            //     output: {name: out_node.properties.name, type: out_node.properties.type}
            // })
        }
    }
    exports.ContainerNode = ContainerNode;
    nodes_1.Nodes.registerNodeType("main/container", ContainerNode);
    //Input for a container
    class ContainerInputNode extends node_1.Node {
        constructor() {
            super();
            //When added to container tell the container this is a new global input
            this.onAdded = function () {
                if (this.isBackside()) {
                    let cont_node = this.container.container_node;
                    cont_node.addInput(this.properties.name, this.properties.type);
                    this.properties.slot = cont_node.inputs.length - 1;
                }
            };
            this.onExecute = function () {
                let cont_node = this.container.container_node;
                let val = cont_node.inputs[this.properties.slot].data;
                this.setOutputData(0, val);
            };
            this.title = "Input";
            this.desc = "Input of the container";
            //random name to avoid problems with other outputs when added
            let input_name = "input_" + (Math.random() * 1000).toFixed();
            this.addOutput(input_name, null);
            this.properties = { name: input_name, type: null };
            let that = this;
            // Object.defineProperty(this.properties, "name", {
            //     get: function () {
            //         return input_name;
            //     },
            //     set: function (v) {
            //         if (v == "")
            //             return;
            //
            //         let info = that.getOutputInfo(0);
            //         if (info.name == v)
            //             return;
            //         info.name = v;
            //         if (that.container)
            //             that.container.renameContainerInput(input_name, v);
            //         input_name = v;
            //     },
            //     enumerable: true
            // });
            //
            // Object.defineProperty(this.properties, "type", {
            //     get: function () {
            //         return that.outputs[0].type;
            //     },
            //     set: function (v) {
            //         that.outputs[0].type = v;
            //         if (that.container)
            //             that.container.changeConainerInputType(input_name, that.outputs[0].type);
            //     },
            //     enumerable: true
            // });
        }
    }
    exports.ContainerInputNode = ContainerInputNode;
    nodes_1.Nodes.registerNodeType("main/input", ContainerInputNode);
    //Output for a container
    class ContainerOutputNode extends node_1.Node {
        constructor() {
            super();
            this.onAdded = function () {
                if (this.isBackside()) {
                    let cont_node = this.container.container_node;
                    cont_node.addOutput(this.properties.name, this.properties.type);
                    this.properties.slot = cont_node.outputs.length - 1;
                }
            };
            this.onExecute = function () {
                let cont_node = this.container.container_node;
                let val = this.getInputData(0);
                cont_node.outputs[this.properties.slot].data = val;
            };
            this.title = "Ouput";
            this.desc = "Output of the container";
            //random name to avoid problems with other outputs when added
            let output_name = "output_" + (Math.random() * 1000).toFixed();
            this.addInput(output_name, null);
            this.properties = { name: output_name, type: null };
            let that = this;
            // Object.defineProperty(this.properties, "name", {
            //     get: function () {
            //         return output_name;
            //     },
            //     set: function (v) {
            //         if (v == "")
            //             return;
            //
            //         let info = that.getInputInfo(0);
            //         if (info.name == v)
            //             return;
            //         info.name = v;
            //         if (that.container)
            //             that.container.renameContainerOutput(output_name, v);
            //         output_name = v;
            //     },
            //     enumerable: true
            // });
            //
            // Object.defineProperty(this.properties, "type", {
            //     get: function () {
            //         return that.inputs[0].type;
            //     },
            //     set: function (v) {
            //         that.inputs[0].type = v;
            //         if (that.container)
            //             that.container.changeConainerInputType(output_name, that.inputs[0].type);
            //     },
            //     enumerable: true
            // });
        }
    }
    exports.ContainerOutputNode = ContainerOutputNode;
    nodes_1.Nodes.registerNodeType("main/output", ContainerOutputNode);
});
//# sourceMappingURL=main.js.map