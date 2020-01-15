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
    public static String updateTask(TrelloCard__c updatedCard) {
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