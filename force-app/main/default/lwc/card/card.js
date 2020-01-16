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
import dragAndDrop from '@salesforce/apex/TrelloController.dragAndDrop';

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
                this.cardList = cardList.sort((a, b) => a.Order__c - b.Order__c);
            }
            if (error) {
                console.error('loadCards' + JSON.stringify(error));
            }
        }

    allowDrop(e) {
        e.preventDefault();

        this.hideAllSupportWrappers();
        if (e.target.closest('.card-wrap')) {
            e.target.closest('.card-wrap').querySelector('.add-drop').classList.remove('hidden');
        } else {
            e.target.closest('.main-type').querySelector('.add-drop').classList.remove('hidden');
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
    }

    drop(e) {
        e.preventDefault();
        const dataId = e.dataTransfer.getData("Text");
        const typeId = e.target.closest('.card-wrap').dataset.id;

        dragAndDrop({ dragId: dataId, targetId: typeId})
            .then(() => this.dispatchEvent(new CustomEvent('allcardupdate')))
            .catch(e => console.error(e));

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