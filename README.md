# Redcoat - Collaborative Annotation Tool for Hierarchical Entity Typing

Redcoat is a lightweight web-based annotation tool for labelling entity recognition data.

## Dependencies

As of 14 August 2024, Docker is the only supported method of running Redcoat. Docker is thus the only required dependency.

## Running via Docker

You can deploy the application using the provided docker-compose file. First, build the services:

```
docker-compose build
```

Then:

```
docker-compose up
```

The client will be accessible at [http://localhost:4000](http://localhost:4000). From here you will be able to register for an account\*, log in, and start using Redcoat.

\*all data is stored on a local MongoDB instance (which is also managed by Docker).
