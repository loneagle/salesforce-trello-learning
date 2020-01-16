/**
 * Created by dmytrodemchuk on 30.12.2019.
 */

import { LightningElement, api } from "lwc";

import updateTask from '@salesforce/apex/TrelloController.updateTask';

export default class CardModal extends LightningElement {
  @api show = false;
  @api task = {};
  @api type = '';

  constructor() {
    super();
    this.template.addEventListener('click', this.outsideEditTitleClick.bind(this));
  }

  closeModal() {
    this.dispatchEvent(new CustomEvent('closemodal'));
  }

  outsideEditTitleClick(e) {
    if (e.target.classList[0] !== 'task-modal-title-text') {
      this.closeEditTitle();
    }
    if (e.target.classList[0] !== 'description-area') {
      this.editTaskDesc(e);
    }
  }

  closeEditTitle(e) {
    if (this.editTaskTitle(e)) {
      this.template.querySelector('div.task-modal-title-text').innerHTML = this.template.querySelector('textarea.task-modal-title-text').value;
    }

    this.template.querySelector('div.task-modal-title-text').classList.remove('hidden');
    this.template.querySelector('textarea').classList.add('hidden');
  }

  editCardTitleClick(e) {
    const area = e.target.closest('.task-modal-title-area');

    area.querySelector('.task-modal-title-text').classList.add('hidden');
    area.querySelector('textarea.task-modal-title-text').classList.remove('hidden');
    area.querySelector('textarea.task-modal-title-text').select();
  }

  editTaskTitle() {
    const edited = this.template.querySelector('div.task-modal-title-text').innerHTML !== this.template.querySelector('textarea.task-modal-title-text').value;
    if (edited) {
      const card = {
        Id: this.template.querySelector('.task-modal').dataset.id,
        Name: this.template.querySelector('textarea.task-modal-title-text').value,
        sobjectType: 'TrelloCard__c',
      };

      updateTask({ updatedCard: card })
          .then(() => document.dispatchEvent(new CustomEvent('cardupdate')))
    }
    return edited;
  }

  editTaskDesc() {
    const card = {
      Id: this.template.querySelector('.task-modal').dataset.id,
      Text__c: this.template.querySelector('textarea.description-area').value,
      sobjectType: 'TrelloCard__c',
    };

    updateTask({ updatedCard: card })
        .then(() => document.dispatchEvent(new CustomEvent('cardupdate')))
  }
}