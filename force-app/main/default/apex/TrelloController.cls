/**
 * Created by dmytrodemchuk on 27.12.2019.
 */

public with sharing class TrelloController {
    @AuraEnabled(cacheable=true)
    public static List<Trello__c> getAllTrelloData() {
        return [SELECT id, Type__c, Title__c, Text__c FROM Trello__c];
    }

    @AuraEnabled(cacheable=true)
    public static String setNewTrelloData() {
        Id profileId= userinfo.getProfileId();
        String profileName=[Select Id,Name from Profile where Id=:profileId].Name;
        return profileName;
    }
}