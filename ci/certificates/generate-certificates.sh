#!/bin/bash

openssl req \
  -x509 \
  -days 365 \
  -nodes \
  -keyout key.pem \
  -out cert.pem \
  -config ssl.cnf

# To add it in MacOS, open Keychain Access > System > add cert.pem here
# security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain cert.pem
