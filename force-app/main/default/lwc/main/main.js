import {
  LightningElement,
  track,
} from 'lwc';
import getAllBoards from '@salesforce/apex/TrelloController.getAllBoards';

export default class main extends LightningElement {
  @track boards = [];
  @track openedBoard = false;

  connectedCallback() {
    this.loadBoards();
  }

  loadBoards() {
    getAllBoards()
      .then(result => {
        this.boards = result;
      })
      .catch(error => {
        this.error = error;
        alert('loadBoards ' + error);
      });
  }

  openBoard(e) {
    this.openedBoard = this.boards.find(item => item.Id === e.target.closest('.boards-cards').dataset.id);
  }
}