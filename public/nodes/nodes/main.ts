/**
 * Created by Derwish (derwish.pro@gmail.com) on 04.07.2016.
 */


import {Node} from "../node";
import {Container, Side} from "../container";
import Utils from "../utils";


//Constant
export class ConstantNode extends Node {
    constructor() {
        super();
        this.title = "Constant";
        this.descriprion = "Constant value";

        this.settings["value"] = {description: "Value", value: 1};
        this.settings["output-type"] = {
            description: "Output type",
            type: "dropdown",
            config: {
                elements: [
                    // {key: "any", text: "any"},
                    {key: "string", text: "string"},
                    {key: "number", text: "number"},
                    {key: "boolean", text: "boolean"}
                ]
            },
            value: "number"
        };

        this.addOutput("1", "number");
    }

    // setValue  (v) {
    //     // if (typeof(v) == "string") v = parseFloat(v);
    //     this.settings["value"] = v;
    // }

    onExecute() {
        let val = this.settings["value"].value;
        let out_type = this.settings["output-type"].value;
        this.setOutputData(0, Utils.formatValue(val, out_type));
    }


    onSettingsChanged() {
        //change output type
        let out_type = this.settings["output-type"].value;
        if (out_type == "any")
            out_type = null;
        if (out_type != this.outputs[0].type)
            this.outputs[0].type = out_type;

        //change output name
        let val = this.settings["value"].value;
        val = Utils.formatValue(val, out_type);
        this.outputs[0].name = Utils.formatAndTrimValue(val);


        if (this.container.db) {
            let s_node = this.serialize(true);
            this.container.db.updateNode(this.id, this.container.id, {$set: {outputs: s_node.outputs}});
        }

        if (this.side == Side.editor) {
            if (!(<any>window).editor.showNodesIOValues) {
                this.outputs[0].label = this.outputs[0].name;
                this.setDirtyCanvas(true, true);
            }
        }
    }
}
Container.registerNodeType("main/constant", ConstantNode);


//Container: a node that contains a container of other nodes
export class ContainerNode extends Node {
    sub_container: Container;
    sub_container_id: number;

    constructor(container) {
        super(container);

        this.title = "Container";
        this.descriprion = "Contain other nodes";
        this.settings["name"] = {description: "Container name", type: "string", value: this.title};
    }

    onCreated() {
        this.sub_container = new Container(this.side);
        this.sub_container_id = this.sub_container.id;

        this.settings["name"].value = "Container " + this.sub_container.id;;

        this.sub_container.container_node = this;
        this.sub_container.parent_container_id = this.container.id;

        if (this.container.db)
            this.container.db.updateLastContainerId(this.sub_container_id);

    }

    onAdded() {
        this.changeTitle();
    }


    onRemoved() {
        for (let id in this.sub_container._nodes) {
            let node = this.sub_container._nodes[id];
            node.container.remove(node);
        }

        delete Container.containers[this.sub_container.id];
    };

    configure(data, from_db = false) {
        super.configure(data);

        this.sub_container = Container.containers[data.sub_container.id];
        if (!this.sub_container)
            this.sub_container = new Container(this.side, data.sub_container.id);

        this.sub_container.container_node = this;
        this.sub_container.parent_container_id = this.container.id;

        this.sub_container.configure(data.sub_container, true);
    }

    serialize(for_db = false) {
        let data = super.serialize(for_db);

        (<any>data).sub_container = this.sub_container.serialize(!for_db);

        return data;
    }


    getExtraMenuOptions(renderer) {
        let that = this;
        return [{
            content: "Open", callback: function () {
                renderer.openContainer(that.sub_container, true);
            }
        }];
    }

    onExecute() {
        this.sub_container.runStep();
    }

    onSettingsChanged() {
        this.changeTitle();
    }

    changeTitle() {
        this.title = this.settings["name"].value;
        this.size = this.computeSize();
        this.sub_container.name = this.title;

        // if (this.container.db)
        //     this.container.db.updateNode(this.id,this.container.id,{$set:{}})
        // if (this.side==Side.server)
    }


    clone() {

        let node = this.container.createNode(this.type);
        let data = this.serialize();
        delete data["id"];
        delete data["inputs"];
        delete data["outputs"];
        node.configure(data);
        return node;
    }


}
Container.registerNodeType("main/container", ContainerNode);


//Input for a container
export class ContainerInputNode extends Node {
    constructor(container) {
        super(container);

        this.title = "Input";
        this.descriprion = "Input of the container";

        this.addOutput("input", null);

        this.properties = {type: null};
    }


    onCreated() {


        //add output on container node
        let cont_node = this.container.container_node;
        let id = cont_node.addInput(null, this.properties['type']);
        cont_node.setDirtyCanvas(true, true);
        this.properties['slot'] = id;

        //update name
        // this.outputs[0].name = cont_node.inputs[id].name;
        this.title = "Input " + (id + 1);

        if (this.container.db) {
            let s_cont_node = cont_node.serialize(true);
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {inputs: s_cont_node.inputs}});
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {size: cont_node.size}});
        }
    }

    onRemoved() {
        //remove  output on container node
        let cont_node = this.container.container_node;
        cont_node.disconnectInput(this.properties['slot']);
        cont_node.removeInput(this.properties['slot']);
        cont_node.setDirtyCanvas(true, true);
        this.properties['slot'] = -1;

        if (this.container.db) {
            let s_cont_node = cont_node.serialize(true);
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {inputs: s_cont_node.inputs}});
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {size: cont_node.size}});
        }
    }

    onExecute() {
        let cont_node = this.container.container_node;
        let val = cont_node.inputs[this.properties['slot']].data;
        this.setOutputData(0, val);
    }


}
Container.registerNodeType("main/input", ContainerInputNode);


//Output for a container
export class ContainerOutputNode extends Node {
    constructor(container) {
        super(container);
        this.title = "Ouput";
        this.descriprion = "Output of the container";

        this.addInput("output", null);

        this.properties = {type: null};
    }


    onCreated() {

        //add output on container node
        let cont_node = this.container.container_node;
        let id = cont_node.addOutput(null, this.properties['type']);
        cont_node.setDirtyCanvas(true, true);
        this.properties['slot'] = id;

        //update name
        // this.inputs[0].name = cont_node.outputs[id].name;
        this.title = "Output " + (id + 1);

        if (this.container.db) {
            let s_cont_node = cont_node.serialize(true);
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {outputs: s_cont_node.outputs}});
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {size: cont_node.size}});
        }
    }

    onRemoved() {
        //remove  output on container node
        let cont_node = this.container.container_node;
        cont_node.disconnectOutput(this.properties['slot']);
        cont_node.removeOutput(this.properties['slot']);
        cont_node.setDirtyCanvas(true, true);
        this.properties['slot'] = -1;

        if (this.container.db) {
            let s_cont_node = cont_node.serialize(true);
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {outputs: s_cont_node.outputs}});
            this.container.db.updateNode(cont_node.id, cont_node.container.id, {$set: {size: cont_node.size}});
        }
    }


    onExecute() {
        let cont_node = this.container.container_node;
        let val = this.getInputData(0);
        cont_node.outputs[this.properties['slot']].data = val;
    }


}
Container.registerNodeType("main/output", ContainerOutputNode);
