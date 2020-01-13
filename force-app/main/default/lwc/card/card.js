/**
 * Created by dmytrodemchuk on 10.01.2020.
 */

import {
    api,
    track,
    LightningElement,
} from 'lwc';

import getAllCardsOfType from '@salesforce/apex/TrelloController.getAllCardsOfType';

export default class Card extends LightningElement {
    @api type = false;
    @track cardList = [];

    loadCards() {
        getAllCardsOfType({ id: this.type })
            .then(result => {
                this.cardList = result;
            })
            .catch(error => {
                alert('loadCards' + JSON.stringify(error));
            });
    }

    dragstart(e) {
        e.dataTransfer.setData('text', e.target.id);
        e.dataTransfer.effectAllowed = 'move';
    }

    connectedCallback() {
        this.loadCards();
    }

    closeSupportWrapper(e) {
        this.hideAllSupportWrappers();

        if (e.target.classList[0].contains('newTask')) {
            this.showNewTask();
        } else {
            e.target.closest('.add-drop').classList.add('hidden');
        }
    }

    drop(e) {
        e.preventDefault();
        const dataId = e.dataTransfer.getData("Text");
        const parent = e.target.closest('.main-type');
        parent.insertBefore(this.template.querySelector(`#${dataId}`), parent.querySelector('.newTask-wrapper'));
        this.hideAllSupportWrappers();
    }

    openModal(e) {
        const targetId = e.target.closest('.card-wrap').dataset.id;
        const task = this.cardList.find(item => item.Id === targetId);
        this.dispatchEvent(new CustomEvent('opentaskmodal', { detail: task }));
    }
}