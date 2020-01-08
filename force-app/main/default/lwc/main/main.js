import {
  LightningElement,
  track,
} from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import TrelloObj from '@salesforce/schema/Trello__c';
import getAllTrelloData from '@salesforce/apex/TrelloController.getAllTrelloData';
import setNewTrelloData from '@salesforce/apex/TrelloController.setNewTrelloData';

const taskFields = {
  apiName: 'Trello__c',
  type: 'Type__c',
  title: 'Title__c',
  text: 'Text__c',
  position: 'Position__c'
};

export default class main extends LightningElement {
  constructor() {
    super();
    this.template.addEventListener('click', this.outsideAddTaskClick.bind(this));
  }

  @track defaultData = [];
  @track mapOfListValues = [];
  @track show = false;
  @track id = "";
  @track type = "";
  @track title = "";
  @track text = "";

  connectedCallback() {
    this.loadTasks();
    this.setNewTrelloDatahtml();
  }

  outsideAddTaskClick(e) {
    let i = 0;
    this.template.querySelectorAll('.newTask-wrapper').forEach(item => {
      if (item.contains(e.target)) {
        i++;
      }
    });
    if (i === 0) {
      this.showNewTask();
    }
  }

  createTask(e) {
    const title = e.target.closest('.newTask-wrapper-input').querySelector('.newTask-area').value;
    const type = e.target.closest('.main-type').querySelector('.title-col').title;
    const fields = {
      Title__c: title,
      Type__c: type,
    };
    const recordInput = { apiName: TrelloObj, fields };
    createRecord(recordInput)
      .then(data => {
        console.log('success', data);
      })
      .catch(error => {
        console.log('error', error);
      });
  }

  addToEmptyTypeDragOver(e) {
    const type = e.target.closest('.main-type');
    if (type.querySelectorAll('.card').length === 0) {
      type.querySelector('.add-drop.hidden').classList.remove('hidden');
    }
  }

  showNewTask(e) {
    this.template.querySelectorAll('.newTask-wrapper-input').forEach(item => item.classList.add('hidden'));
    this.template.querySelectorAll('.newTask-wrapper-input textarea').forEach(item => item.value = '');
    this.template.querySelectorAll('.newTask').forEach(item => item.classList.remove('hidden'));
    if (e) {
      e.currentTarget.parentElement.querySelector('.newTask-wrapper-input').classList.remove('hidden');
      e.currentTarget.classList.add('hidden');
    }
  }

  addToTypeDrop(e) {
    e.preventDefault();
    const dataId = e.dataTransfer.getData("Text");
    const type = e.target.closest('.main-type');

    if (type.querySelectorAll('.card').length === 0) {
      type.insertBefore(this.template.querySelector(`#${dataId}`), type.querySelector('.newTask-wrapper'));
    } else {
      type.insertBefore(this.template.querySelector(`#${dataId}`), type.querySelector('.card'));
    }
    this.hideAllSupportWrappers();
  }

  drop(e) {
    e.preventDefault();
    const dataId = e.dataTransfer.getData("Text");
    const parent = e.target.closest('.main-type');
    parent.insertBefore(this.template.querySelector(`#${dataId}`), parent.querySelector('.newTask-wrapper'));
    this.hideAllSupportWrappers();
  }

  allowDrop(e) {
    e.preventDefault();
    this.template.querySelectorAll('.add-drop').forEach(item => item.classList.add('hidden'));

    if (e.target.closest('.card-wrap')) {
      e.target.closest('.card-wrap').querySelector('.add-drop').classList.remove('hidden');
    } else {
      e.target.closest('.main-type').querySelector('.add-drop').classList.remove('hidden');
    }
  }

  hideAllSupportWrappers() {
    this.template.querySelectorAll('.add-drop').forEach(item => item.classList.add('hidden'));
  }

  closeSupportWrapper(e) {
    this.hideAllSupportWrappers();

    if (e.target.classList[0].contains('newTask')) {
      this.showNewTask();
    } else {
      e.target.closest('.add-drop').classList.add('hidden');
    }
  }

  dragstart(e) {
    e.dataTransfer.setData('text', e.target.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  loadTasks() {
    getAllTrelloData()
      .then(result => {
        const listWithTypes = [
          { type: 'Info', data: []},
          { type: 'Todo', data: []},
          { type: 'In Progress', data: []},
          { type: 'Done', data: []},
        ];
        result.forEach(item => {
          if ((listWithTypes.filter(listItem => item.Type__c === listItem.type)).length) {
            listWithTypes.forEach(listItem => {
              if (item.Type__c === listItem.type) {
                listItem.data.push(item);
              }
            })
          } else {
            listWithTypes.push({ type: item.Type__c, data: [item]});
          }
        });

        this.defaultData = result;
        this.mapOfListValues = listWithTypes;
      })
      .catch(error => {
        this.error = error;
      });
  }

  openModal(e) {
    const targetId = e.target.closest('.card').dataset.id;

    const task = this.defaultData.find(item => item.Id === targetId);
    this.text = task[taskFields.text];
    this.title = task[taskFields.title];
    this.id = task[taskFields.id];
    this.type = task[taskFields.type];

    if (this.show === true) {
      this.show = false;
      setTimeout(() => this.show = true, 1);
    } else
      this.show = true;
  }

  closeModal() {
    this.show = false;
  }

  setNewTrelloDatahtml() {
    setNewTrelloData()
      .then(result => console.log(result))
      .catch(error => {
        this.error = error;
      });
  }
}