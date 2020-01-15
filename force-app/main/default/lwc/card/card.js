/**
 * Created by dmytrodemchuk on 10.01.2020.
 */

import {
    LightningElement,
    track,
    wire,
    api,
} from 'lwc';
import { refreshApex } from '@salesforce/apex';

import getAllCardsOfType from '@salesforce/apex/TrelloController.getAllCardsOfType';

export default class Card extends LightningElement {
    constructor() {
        super();
        document.addEventListener('cardupdate', this.cardUpdate.bind(this));
    }

    wiredData;

    @api type = false;
    @track cardList = [];

    @wire (getAllCardsOfType, { id: '$type' })
        imperativeWiring(result) {
            this.wiredData = result;
            const { error, data } = result;

            if (data) {
                let cardList = [...data];
                this.cardList = cardList.sort((a, b) => b.Order__c - a.Order__c);
            }
            if (error) {
                console.error('loadCards' + JSON.stringify(error));
            }
        }

    cardUpdate() {
        refreshApex(this.wiredData);
    }

    dragstart(e) {
        e.dataTransfer.setData('text', e.target.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
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

    hideAllSupportWrappers() {
        this.template.querySelectorAll('.add-drop').forEach(item => item.classList.add('hidden'));
    }

    openModal(e) {
        const targetId = e.target.closest('.card-wrap').dataset.id;
        const task = this.cardList.find(item => item.Id === targetId);
        this.dispatchEvent(new CustomEvent('opentaskmodal', { detail: task }));
    }
}