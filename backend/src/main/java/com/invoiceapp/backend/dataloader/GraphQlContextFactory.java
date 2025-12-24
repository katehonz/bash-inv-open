package com.invoiceapp.backend.dataloader;

import org.dataloader.DataLoaderRegistry;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * GraphQL interceptor that creates a new DataLoaderRegistry for each request.
 * This ensures proper batching within request scope while isolating data between requests.
 */
@Component
public class GraphQlContextFactory implements WebGraphQlInterceptor {

    private final DataLoaderConfig dataLoaderConfig;

    public GraphQlContextFactory(DataLoaderConfig dataLoaderConfig) {
        this.dataLoaderConfig = dataLoaderConfig;
    }

    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        // Create a new DataLoaderRegistry for this request
        DataLoaderRegistry registry = dataLoaderConfig.createDataLoaderRegistry();

        // Add the registry to the GraphQL context using configureExecutionInput
        request.configureExecutionInput((executionInput, builder) ->
            builder.dataLoaderRegistry(registry).build()
        );

        return chain.next(request);
    }
}
