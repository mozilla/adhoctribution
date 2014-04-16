adhoctribution
==============

A tool for logging ad-hoc contribution activities that we can't count elsewhere

## Dependencies

* Node.js & npm
* Bower: `npm install -g bower`
* grunt-cli: `npm install -g grunt-cli`
* heroku toolbelt
* mysql database

## Setup a table in mysql
See script in sql/table.sql

## Environment Config

For local dev, copy sample.env to .env and add credentials
Set equivilent environment variables on Heroku

## Localhost HTTPS

You will need to generate a self-signed certificate for local development over HTTPS. See http://docs.nodejitsu.com/articles/HTTP/servers/how-to-create-a-HTTPS-server

Save the key and the cert here:

```
/config/key.pem
/config/cert.pem
```

## Running the app:

```
grunt
```
```
foreman start
```
