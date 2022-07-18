Die Überschriften sind die Namen der Tabellen, in Klammern der Datentyp (? > geraten)

# serverconfig

| logchannel (bigint)   |  welcomerole (bigint)  | serverlog (longtext) | modlog (longtext)  |
|-----------------------|------------------------|----------------------|--------------------|
|                       |                        |                      |                    |

# userroles

| userid (bigint)   | roleid (bigint)   |
|-------------------|-------------------|
|                   |                   |

# noniceones

| id (bigint)   | serverid (bigint)   | timestamp (bigint)   |
|---------------|---------------------|----------------------|
|               |                     |                      |

# mutes

| intern (int)    | id (text)     | serverid (bigint)   | bereich | duration | timestamp |
|-----------------|---------------|---------------------|---------|----------|-----------|
|                 |               |                     |         |          |           |

# blacklist

| word (text)   |
|---------------|
|               |

# cases

| caseid (text)   | user (bigint)   | serverid (bigint)   | type (text) | tags (text) | reason (text) | moderator (bigint)   | channel (text) | timestamp (date)    | endTimestamp (bigint) |
|-----------------|-----------------|---------------------|-------------|-------------|---------------|----------------------|----------------|---------------------|-----------------------|
|                 |                 |                     |             |             |               |                      |                |                     |                       |

# whitelist

| link (text)   |
|---------------|
|               |

# usedLinks

| link (text ?) | count (int ?) |
|---------------|---------------|
|               |               |

# usernotes

| user (bigint ?) | moderator (bigint ?) | note (text ?) |     |     |
|-----------------|----------------------|---------------|-----|-----|
|                 |                      |               |     |     |

# botwelle

| userid (bigint ?) | timestamp (time ?) |     |     |
|-------------------|--------------------|-----|-----|
|                   |                    |     |     |
