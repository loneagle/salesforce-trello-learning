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
import dropTaskToTitle from '@salesforce/apex/TrelloController.dropTaskToTitle';
import createNewTask from '@salesforce/apex/TrelloController.createNewTask';
import cloneTypeList from '@salesforce/apex/TrelloController.cloneTypeList';
import deleteType from '@salesforce/apex/TrelloController.deleteType';

export default class board extends LightningElement {
    constructor() {
        super();
        this.template.addEventListener('click', this.outsideAddTaskClick.bind(this));
        this.template.addEventListener('allcardupdate', this.allCardUpdate.bind(this));
    }

    wiredData;

    @api boards;
    @api board;

    @track show = false;
    @track task = {};
    @track type = {};
    @track types = [];

    @wire (getAllTypesOfBoard, { id: '$board.Id' })
        imperativeWiring(result) {
            this.wiredData = result;
            const { error, data } = result;

            if (data) {
                let types = [...data];
                this.types = types.sort((a, b) => a.Order__c - b.Order__c);
            }
            if (error) {
                console.error('loadTypes' + JSON.stringify(error));
            }
        }

    outsideAddTaskClick(e) {
        if(!('contains' in String.prototype)) {
            String.prototype.contains = function(str, startIndex) {
                return -1 !== String.prototype.indexOf.call(this, str, startIndex);
            };
        }

        let i = 0, j = 0;
        this.template.querySelectorAll('.newTask-wrapper').forEach(item => {
            if (item.contains(e.target)) {
                i++;
            }
        });

        if (e.target.classList.value === 'new-card') {
            i++;
            j--;
        }

        if (i === 0) {
            this.showNewTask();
            this.hideNewType();
        }

        if (!this.template.querySelector('.top-panel-boards').contains(e.target)) {
            this.closeBoardSelect();
        }

        this.template.querySelectorAll('.type-options').forEach(item => {
            if (item.contains(e.target)) {
                j++;
            }
        });

        if (j === 0) {
            this.closeTypesModal(e);
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

    showNewTask(e) {
        this.template.querySelectorAll('.main-type .newTask-wrapper-input').forEach(item => item.classList.add('hidden'));
        this.template.querySelectorAll('.main-type .newTask-wrapper-input textarea').forEach(item => item.value = '');
        this.template.querySelectorAll('.main-type .newTask').forEach(item => item.classList.remove('hidden'));

        if (e) {
            e.target.closest('.main-type').querySelector('.newTask-wrapper-input').classList.remove('hidden');
            e.target.closest('.main-type').querySelector('.newTask').classList.add('hidden');
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
            createNewType({
                name: name,
                order: this.types.length - 1,
                trelloBoardRel: this.board.Id
            })
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

        updateType({
            id: e.target.closest('.main-type').dataset.id,
            name: e.target.value,
        })
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
        this.allCardUpdate();
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

                    dropTaskToTitle({ updatedCard: el })
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

    allCardUpdate() {
        document.dispatchEvent(new CustomEvent('cardupdate'));
    }

    hideAllSupportWrappers(e) {
        this.template.querySelectorAll('.add-drop').forEach(item => item.classList.add('hidden'));
    }

    openBoardSelect(e) {
        e.target.closest('.top-panel-boards').querySelector('.top-panel-select-board').classList.remove('hidden');
    }

    closeBoardSelect() {
        this.template.querySelector('.top-panel-select-board').classList.add('hidden');
    }

    openTypesModal(e) {
        e.target.closest('.type-options').querySelector('.type-options-modal').classList.remove('hidden');
    }

    closeTypesModal(e) {
        this.template.querySelectorAll('.type-options-modal').forEach(item => item.classList.add('hidden'));

        if (e) {
            e.target.closest('.type-options').querySelector('.type-options-modal').classList.remove('hidden');
        }
    }

    cloneTypesList(e) {
        const typeId = e.target.closest('.main-type').dataset.id;

        cloneTypeList({ id: typeId })
            .then(() => {
                this.showNewTask();
                refreshApex(this.wiredData);
                document.dispatchEvent(new CustomEvent('cardupdate'));
            })
            .catch(e => console.error(e))
    }

    deleteType(e) {
        const typeId = e.target.closest('.main-type').dataset.id;

        deleteType({ id: typeId })
            .then(() => {
                this.showNewTask();
                refreshApex(this.wiredData);
                document.dispatchEvent(new CustomEvent('cardupdate'));
            })
            .catch(e => console.error(e))
    }

    moveTypeOpen(e) {
        e.target.closest('.type-options-modal').querySelector('.type-options-modal-header-title').classList.toggle('hidden');
        e.target.closest('.type-options-modal').querySelector('.type-options-modal-header-move').classList.toggle('hidden');

        e.target.closest('.type-options-modal').querySelector('.type-options-modal-list').classList.toggle('hidden');
        e.target.closest('.type-options-modal').querySelector('.type-options-modal-move').classList.toggle('hidden');
    }

    changeSelect(e) {
        e.target.closest('.select-wrap').querySelector('.select-wrap-caption-value').innerHTML = e.target.value;
    }

    moveType(e) {
        const typeId = e.target.closest('.main-type').dataset.id;
        const board = e.target.closest('.type-options-modal-move').querySelector('.board-select').value;
        const order = e.target.closest('.type-options-modal-move').querySelector('.order-select').value;

        updateType({ id: typeId, order: order, trelloBoardRel: board })
            .then(() => {
                this.showNewTask();
                refreshApex(this.wiredData);
                document.dispatchEvent(new CustomEvent('cardupdate'));
            })
            .catch(e => console.error(e))
    }
}