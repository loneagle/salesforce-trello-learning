/**
 * Created by dmytrodemchuk on 09.01.2020.
 */

import {
    LightningElement,
    track,
    wire,
    api,
} from 'lwc';
import { refreshApex } from '@salesforce/apex';

import getAllTypesOfBoard from '@salesforce/apex/TrelloController.getAllTypesOfBoard';
import createNewType from '@salesforce/apex/TrelloController.createNewType';
import updateType from '@salesforce/apex/TrelloController.updateType';
import getCardById from '@salesforce/apex/TrelloController.getCardById';
import updateTask from '@salesforce/apex/TrelloController.updateTask';
import createNewTask from '@salesforce/apex/TrelloController.createNewTask';

export default class board extends LightningElement {
    constructor() {
        super();
        this.template.addEventListener('click', this.outsideAddTaskClick.bind(this));
    }

    wiredData;

    @api board = null;

    @track show = false;
    @track task = {};
    @track type = {};
    @track types = [];

    @wire (getAllTypesOfBoard, { id: '$board' })
        imperativeWiring(result) {
            this.wiredData = result;
            const { error, data } = result;

            if (data) {
                let types = [...data];
                this.types = types.sort((a, b) => b.Order__c - a.Order__c);
            }
            if (error) {
                console.error('loadTypes' + JSON.stringify(error));
            }
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
            this.hideNewType();
        }
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

    createTask(e) {
        const title = e.target.closest('.newTask-wrapper-input').querySelector('.newTask-area').value;
        const type = e.target.closest('.main-type').dataset.id;

        if (title.length > 0) {
            createNewTask({ name: title, trelloColumnRel: type })
                .then(() => {
                    this.showNewTask();
                    refreshApex(this.wiredData);
                    document.dispatchEvent(new CustomEvent('cardupdate'));
                })
                .catch(e => console.error(e))
        }
    }

    addToEmptyTypeDragOver(e) {
        const type = e.target.closest('.main-type');
        if (type.querySelectorAll('.card').length === 0) {
            type.querySelector('.add-drop.hidden').classList.remove('hidden');
        }
    }

    showNewTask(e) {
        this.template.querySelectorAll('.main-type .newTask-wrapper-input').forEach(item => item.classList.add('hidden'));
        this.template.querySelectorAll('.main-type .newTask-wrapper-input textarea').forEach(item => item.value = '');
        this.template.querySelectorAll('.main-type .newTask').forEach(item => item.classList.remove('hidden'));
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

    showNewType(e) {
        e.target.closest('.newTask-wrapper.newType').querySelector('.newTask').classList.add('hidden');
        e.target.closest('.newTask-wrapper.newType').querySelector('.newType-input').classList.remove('hidden');
    }

    hideNewType(e) {
        if (e) {
            e.preventDefault();
            e.blur();
        }

        this.template.querySelector('.newType-input').classList.add('hidden');
        this.template.querySelector('.newType-input textarea').value = '';
        this.template.querySelector('.newTask-wrapper.newType .newTask').classList.remove('hidden');
    }

    addNewType(e) {
        if (e) {
            e.preventDefault();
        }
        const name = e.target.closest('.newTask-wrapper.newType').querySelector('textarea').value.trim();

        if (name.length > 0) {
            let newType = { 'sobjectType': 'TrelloColumn__c' };
            newType.Name = name;
            newType.TrelloBoardRel__c = this.board;
            newType.Order__c = this.types.length;
            createNewType({ newRecord: newType })
                .then(() => {
                    refreshApex(this.wiredData);
                    this.hideNewType();
                })
                .catch((err)=> console.error(err));
        }
    }

    editTitleHandler(e) {
        e.target.closest('.title-wrap').querySelector('.title-col').classList.add('hidden');
        e.target.closest('.title-wrap').querySelector('.title-col-textarea').classList.remove('hidden');
        e.target.closest('.title-wrap').querySelector('.title-col-textarea').select();
    }

    editTitle(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.editTitleMain(e);
            e.blur();
        }
    }

    editTitleMain(e) {
        e.target.closest('.title-wrap').querySelector('.title-col').innerHTML = e.target.value;
        e.target.closest('.title-wrap').querySelector('.title-col').classList.remove('hidden');
        e.target.classList.add('hidden');

        let updatedType = { 'sobjectType': 'TrelloColumn__c' };
        updatedType.TrelloBoardRel__c = this.board;
        updatedType.Id = e.target.closest('.main-type').dataset.id;
        updatedType.Order__c = 2;
        updatedType.Name = e.target.value;

        updateType({ updatedRecord: updatedType })
            .then((e) => console.info('updateType', e))
            .catch(e => console.error(e));
    }


    openModal(e) {
        this.task = e.detail;
        this.type = this.types.find(item => item.Id === e.detail.TrelloColumnRel__c);
        this.show = true;
    }

    closeModal() {
        this.show = false;
    }

    drop(e) {
        e.preventDefault();
        const dataId = e.dataTransfer.getData("Text");
        const typeId = e.target.closest('.main-type').dataset.id;

        getCardById({ id: dataId }).then(arr => {
            if (arr.length) {
                const el = Object.assign({}, arr[0]);
                if (dataId && typeId) {
                    el.Order__c = 0;
                    el.TrelloColumnRel__c = typeId;
                    el.sobjectType = 'TrelloCard__c';

                    updateTask({ updatedCard: el })
                        .then(e => {
                            refreshApex(this.wiredData)
                                .then(() => {
                                    document.dispatchEvent(new CustomEvent('cardupdate'));
                                })
                                .catch(e => console.error(e))
                        })
                        .catch(e => console.error(e));
                }
            }
        }).catch(e => console.error(e));

        this.hideAllSupportWrappers();
    }

    hideAllSupportWrappers(e) {
        this.template.querySelectorAll('.add-drop').forEach(item => item.classList.add('hidden'));
    }
}