/**
 * Created by dmytrodemchuk on 30.12.2019.
 */

import { LightningElement, api, track } from "lwc";

import updateTask from '@salesforce/apex/TrelloController.updateTask';
import saveFile from '@salesforce/apex/TrelloController.saveFile';

export default class CardModal extends LightningElement {
  @api show = false;
  @api task = {};
  @api type = '';

  @track fileReader;
  @track fileContents;
  @track content;
  @track filesUploaded;

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

  handleFilesChange(event) {
    if(event.target.files.length > 0) {
      this.filesUploaded = event.target.files;
      this.fileName = event.target.files[0].name;
    }
  }

  handleSave() {
    if(this.filesUploaded.length > 0) {
      this.uploadHelper();
    }
    else {
      this.fileName = 'Please select file to upload!!';
    }
  }

  uploadHelper() {
    this.file = this.filesUploaded[0];
    this.fileReader= new FileReader();
    this.fileReader.onloadend = (() => {
      this.fileContents = this.fileReader.result;
      let base64 = 'base64,';
      this.content = this.fileContents.indexOf(base64) + base64.length;
      this.fileContents = this.fileContents.substring(this.content);

      this.saveToFile();
    });

    this.fileReader.readAsDataURL(this.file);
  }

  saveToFile() {
    saveFile({ id: this.task.id, strFileName: this.file.name, base64Data: encodeURIComponent(this.fileContents)})
      .then(result => {
        this.fileName = this.fileName + ' - Uploaded Successfully';
      })
      .catch(error => {
        console.log(error);
      });
  }
}