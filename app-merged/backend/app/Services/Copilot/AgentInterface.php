<?php

namespace App\Services\Copilot;

/**
 * Contract for all copilot agents.
 */
interface AgentInterface
{
    /**
     * Process a user query and return structured results.
     *
     * @param  string  $query  The user's natural language query
     * @param  array   $context  Contextual data (user, scope, filters, conversation history)
     * @return array   Structured response with summary, insights, recommendations, etc.
     */
    public function handle(string $query, array $context): array;

    /**
     * Get the agent's name identifier.
     */
    public function name(): string;

    /**
     * Get the intents this agent can handle.
     *
     * @return string[]
     */
    public function supportedIntents(): array;
}
