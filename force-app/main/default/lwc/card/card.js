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
                console.log(this.cardList);
            })
            .catch(error => {
                alert('loadCards' + JSON.stringify(error));
            });
    }

    connectedCallback() {
        this.loadCards();
    }
}