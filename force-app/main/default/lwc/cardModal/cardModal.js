/**
 * Created by dmytrodemchuk on 30.12.2019.
 */

import { LightningElement, api } from "lwc";

export default class CardModal extends LightningElement {
  @api show = false;
  @api text = '';
  @api type = '';
  @api id = '';
  @api closemodal = '';
}