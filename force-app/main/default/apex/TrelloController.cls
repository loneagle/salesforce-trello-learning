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
    public static void createNewType(String name, Integer order, String trelloBoardRel) {
        TrelloColumn__c newType = new TrelloColumn__c(
            Name = name,
            Order__c = order,
            TrelloBoardRel__c = trelloBoardRel
        );
        insert newType;
    }

    @AuraEnabled
    public static void updateType(String id, String name, Integer order, String trelloBoardRel) {
        TrelloColumn__c oldType = [SELECT Id, Order__c FROM TrelloColumn__c WHERE Id = :id][0];

        if ((name != null) && (name.length() > 0)) {
            oldType.Name = name;
        }

        if ((trelloBoardRel != null) && (trelloBoardRel.length() > 0)) {
            oldType.TrelloBoardRel__c = trelloBoardRel;
        }

        if (order >= 0) {
            oldType.Order__c = order;
            List<TrelloColumn__c> allTypesInBoard = [SELECT Id, Name, Order__c FROM TrelloColumn__c WHERE TrelloBoardRel__c = :trelloBoardRel];

            List<TrelloColumn__c> updatedList = new List<TrelloColumn__c>();

            for (TrelloColumn__c typeListItem : allTypesInBoard) {
                if (typeListItem.Order__c > order) {
                    typeListItem.Order__c++;
                    updatedList.add(typeListItem);

                    if (typeListItem.Order__c > oldType.Order__c) {
                        typeListItem.Order__c--;
                        updatedList.add(typeListItem);
                    }
                } else if (typeListItem.Order__c > oldType.Order__c) {
                    typeListItem.Order__c--;
                    updatedList.add(typeListItem);
                } else {
                    updatedList.add(typeListItem);
                }
            }

            System.debug(updatedList);
        }

        update oldType;
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
    public static void dropTaskToTitle(TrelloCard__c updatedCard) {
        List<TrelloCard__c> targetCardList = [SELECT Id, Name, Order__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :updatedCard.TrelloColumnRel__c];

        for (TrelloCard__c cardListItem : targetCardList) {
            cardListItem.Order__c++;
            update cardListItem;
        }

        update updatedCard;
    }

    @AuraEnabled
    public static void updateTask(TrelloCard__c updatedCard) {
        update updatedCard;
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
        Id profileId = userinfo.getProfileId();
        String profileName = [SELECT Id,Name FROM Profile WHERE Id = :profileId].Name;
        return profileName;
    }

    @AuraEnabled
    public static void cloneTypeList(String id) {
        List<TrelloCard__c> typeCards = [SELECT Id, Name, Text__c, Order__c, TrelloColumnRel__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :id];

        TrelloColumn__c typeForClone = [SELECT Id, Name, Order__c, TrelloBoardRel__c FROM TrelloColumn__c WHERE Id = :id][0];

        TrelloColumn__c newType = new TrelloColumn__c(
                Name = typeForClone.Name,
                Order__c = typeForClone.Order__c,
                TrelloBoardRel__c = typeForClone.TrelloBoardRel__c
        );

        insert newType;

        for (TrelloCard__c cardListItem : typeCards) {
            TrelloCard__c newCard = new TrelloCard__c(
                    Name = cardListItem.Name,
                    Order__c = cardListItem.Order__c,
                    Text__c = cardListItem.Text__c,
                    TrelloColumnRel__c = newType.Id
            );
            insert newCard;
        }
    }

    @AuraEnabled
    public static void deleteType(String id) {
        List<TrelloCard__c> typeCards = [SELECT Id, Name, Text__c, Order__c, TrelloColumnRel__c FROM TrelloCard__c WHERE TrelloColumnRel__c = :id];
        delete typeCards;

        TrelloColumn__c deleteType = [SELECT Id FROM TrelloColumn__c WHERE Id = :id][0];
        delete deleteType;
    }
}