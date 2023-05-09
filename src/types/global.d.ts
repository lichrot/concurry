interface AggregateError {
  new (errors: any[], message?: string): AggregateError;
}

declare var AggregateError: AggregateError;
