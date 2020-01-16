/**
 * Created by dmytrodemchuk on 27.12.2019.
 */

public with sharing class TrelloController {
    @AuraEnabled(cacheable=true)
    public static List<TrelloBoard__c> getAllBoards() {
        return [SELECT Id, Name FROM TrelloBoard__c];
    }

    @AuraEnabled(cacheable=true)
    public static List<TrelloColumn__c> getAllTypesOfBoard(String id) {
        return [SELECT Id, Name, Order__c FROM TrelloColumn__c WHERE TrelloBoardRel__c = :id];
    }

    @AuraEnabled
    public static String createNewType(TrelloColumn__c newRecord) {
        insert newRecord;
        return newRecord.Id;
    }

    @AuraEnabled
    public static void updateType(TrelloColumn__c updatedRecord) {
        update updatedRecord;
    }

    @AuraEnabled
    public static void createNewTask(String name, String trelloColumnRel) {
        List<TrelloCard__c> len = [SELECT Id FROM TrelloCard__c WHERE TrelloColumnRel__c = :trelloColumnRel];

        TrelloCard__c newCard = new TrelloCard__c(
                Name = name,
                Text__c = '',
                Order__c = len.size(),
                TrelloColumnRel__c = trelloColumnRel
        );

        insert newCard;
    }

    @AuraEnabled
    public static void dragAndDrop(String dragId, String targetId) {
        if ((targetId.length() > 0) && (dragId.length() > 0) && (targetId != dragId)) {
            TrelloCard__c targetCard = [SELECT TrelloColumnRel__c, Order__c FROM TrelloCard__c WHERE Id = :targetId][0];
            TrelloCard__c dragCard = [SELECT TrelloColumnRel__c, Order__c FROM TrelloCard__c WHERE Id = :dragId][0];
            List<TrelloCard__c> targetCardList = [SELECT Id, Name, Order__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :targetCard.TrelloColumnRel__c];
            List<TrelloCard__c> dragCardList = [SELECT Id, Name, Order__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :dragCard.TrelloColumnRel__c];

            for (TrelloCard__c cardListItem : targetCardList) {
                if (cardListItem.Order__c > targetCard.Order__c) {
                    cardListItem.Order__c++;
                    update cardListItem;
                }
            }

            for (TrelloCard__c cardListItem : dragCardList) {
                if (cardListItem.Order__c > dragCard.Order__c) {
                    cardListItem.Order__c--;
                    update cardListItem;
                }
            }


            dragCard.TrelloColumnRel__c = targetCard.TrelloColumnRel__c;
            dragCard.Order__c = targetCard.Order__c + 1;

            update dragCard;
        }
    }

    @AuraEnabled
    public static String dropTaskToTitle(TrelloCard__c updatedCard) {
        List<TrelloCard__c> targetCardList = [SELECT Id, Name, Order__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :updatedCard.TrelloColumnRel__c];

        for (TrelloCard__c cardListItem : targetCardList) {
            cardListItem.Order__c++;
            update cardListItem;
        }

        update updatedCard;
        return updatedCard.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<TrelloCard__c> getAllCardsOfType(String id) {
        return [SELECT Id, Name, Text__c, Order__c, TrelloColumnRel__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :id];
    }

    @AuraEnabled(cacheable=true)
    public static List<TrelloCard__c> getCardById(String id) {
        return [SELECT Id, Name, Text__c, Order__c, TrelloColumnRel__c FROM TrelloCard__c WHERE Id = :id];
    }

    @AuraEnabled(cacheable=true)
    public static String setNewTrelloData() {
        Id profileId= userinfo.getProfileId();
        String profileName=[SELECT Id,Name FROM Profile WHERE Id=:profileId].Name;
        return profileName;
    }
}