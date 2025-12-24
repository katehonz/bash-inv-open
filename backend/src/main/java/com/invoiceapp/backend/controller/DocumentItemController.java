package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.dataloader.DataLoaderConfig;
import com.invoiceapp.backend.model.DocumentItem;
import com.invoiceapp.backend.model.Item;
import graphql.schema.DataFetchingEnvironment;
import org.dataloader.DataLoader;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.util.concurrent.CompletableFuture;

/**
 * GraphQL controller for DocumentItem field resolvers.
 * Uses DataLoader for efficient batched loading of related entities.
 */
@Controller
public class DocumentItemController {

    /**
     * DataLoader-based resolver for DocumentItem.item
     * Batches multiple item lookups into a single database query
     */
    @SchemaMapping(typeName = "DocumentItem", field = "item")
    public CompletableFuture<Item> item(DocumentItem documentItem, DataFetchingEnvironment env) {
        // If item is already loaded (not a proxy), return it directly
        if (documentItem.getItem() != null && org.hibernate.Hibernate.isInitialized(documentItem.getItem())) {
            return CompletableFuture.completedFuture(documentItem.getItem());
        }

        Item item = documentItem.getItem();
        if (item == null) {
            return CompletableFuture.completedFuture(null);
        }

        DataLoader<Long, Item> dataLoader = env.getDataLoader(DataLoaderConfig.ITEM_BY_ID);
        return dataLoader.load(item.getId());
    }
}
