/**
 * Created by Derwish (derwish.pro@gmail.com) on 25.02.17.
 * License: http://www.gnu.org/licenses/gpl-3.0.txt
 */


import { Node } from "../../node";
import Utils from "../../utils";
import { Side, Container } from "../../container";
import { UiNode } from "./ui-node";

let template =
    '<div class="ui attached clearing segment" id="node-{{id}}">\
        <span id="nodeTitle-{{id}}"></span>\
        <div class="ui right floated basic disabled button nonbutton">\
            <span class="ui blue basic label" id="labelValue-{{id}}"></span>\
        </div>\
    </div>';


export class UiLabelNode extends UiNode {

    constructor() {
        super("Label", "UiLabelNode");

        this.descriprion = "Show value of input";
        this.properties['state'] = '-';

        this.addInput("input");

        this.UPDATE_INPUTS_INTERVAL = 100;
    }


    onAdded() {
        super.onAdded();

        if (this.side == Side.dashboard) {
            this.onGetMessageToDashboardSide({ value: this.properties['state'] })
        }
    }

    onInputUpdated() {
        this.properties['state'] = Utils.formatAndTrimValue(this.getInputData(0));
        if (this.properties['state'] == "")
            this.properties['state'] = "-";

        this.isRecentlyActive = true;

        this.sendMessageToDashboardSide({ value: this.properties['state'] });
    };

    onGetMessageToDashboardSide(data) {
        $('#labelValue-' + this.id).html(data.value);
    };
}

Container.registerNodeType("ui/label", UiLabelNode);


