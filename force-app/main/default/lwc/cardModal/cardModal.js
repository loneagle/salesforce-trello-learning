/**
 * Created by dmytrodemchuk on 30.12.2019.
 */

import { LightningElement, api } from "lwc";

export default class CardModal extends LightningElement {
  @api show = false;
  @api task = {};
  @api type = '';

  closeModal(e) {
    this.dispatchEvent(new CustomEvent('closemodal'));
  }
}