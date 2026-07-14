update "oauthClient"
   set "tokenEndpointAuthMethod" = 'client_secret_post',
       "updatedAt" = current_timestamp
 where name = 'USSTM Portal';
