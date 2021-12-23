# edge-router-utils
Management of Ubiquity UniFy EdgeRouter.
Module extends [SSH2Promise](https://www.npmjs.com/package/ssh2-promise) class,
and adds few methods specific for working with EdgeRouters.

# Installation
```javascript
npm install edge-router-utils
```

# Configuring router
1. Log into your EdgeRouter console:
  - either click CLI icon in topright of GUI window
  - or use your existing SSH/Telnet connection
2. Generate authentication key pair for accessing router and add public key for authorisation:
```
cd /tmp
ssh-keygen -t rsa -b 4096 -C "edge-router-utils" -N "" -f auth.key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat auth.key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```
3. Copy content of your private key `/tmp/auth.key` and save it on your local computer in `auth.key` file somewhere on your system, usually close to your NodeJS script:
```
cat /tmp/auth.key
```
4. Optionally copy also content of your public key `/tmp/auth.key.pub` and save it on your local computer in `auth.key.pub` file somewhere on your system, usually close to your NodeJS script:
```
/tmp/auth.key.pub
```

Note: If you already have key pair, you could also use following command to copy private key for authorisation easily on Mac and Linux:
```
ssh-copy-id -i auth.key -o PreferredAuthentications=password -o PubkeyAuthentication=no edge_username@edge_ip_address
```

# Usage
```javascript
'use strict'
const EdgeRouter = require('edge-router-utils')
const CONNECTION = {
  host: '192.168.0.1',
  username: 'admin',
  identity: '/path/to/auth.key',
}
async function run(){
  const router = new EdgeRouter(CONNECTION)
  try{
    await router.connect()
    console.log('DHCP:', await router.dhcp())
    console.log('DNS:', await router.dns())
  }catch(e){
    console.error('Error:',e.message)
  }
  try{ await router.close() }catch(e){}
}
run()
```

# API
`require('edge-router-utils')`

## Key methods derived from [SSH2Promise](https://www.npmjs.com/package/ssh2-promise)

Note: these are described for convenience only and the description is only partial.
Consult [SSH2Promise](https://www.npmjs.com/package/ssh2-promise) for all details and additional methods available.

### **constructor**(< _array_ >|< _object_ >sshConfig, < _(Promise)_ >disableCache)

Creates and returns a new SSH2Promise instance. Single or multiple sshconfigs can be passed. sshConfig passed to SSH2Promise is aligned to [ssh2](https://www.npmjs.com/package/ssh2) library. It has few extra options other than ssh2 configuration.
  * **host** - _string_ - Hostname or IP address of the server. **Default:** `'localhost'`

  * **port** - _integer_ - Port number of the server. **Default:** `22`

  * **username** - _string_ - Username for authentication. **Default:** (none)

  * **password** - _string_ - Password for password-based user authentication. **Default:** (none)

  * **privateKey** - _mixed_ - _Buffer_ or _string_ that contains a private key for either key-based or hostbased user authentication (OpenSSH format). **Default:** (none)

  * **passphrase** - _string_ - For an encrypted private key, this is the passphrase used to decrypt it. **Default:** (none)

  * **identity** - to directly pass the path of private key file.

### **close**() - _(Promise)_

Close the sshconnection and associated tunnels.


## Added methods specific for edge-router-utils

### **loadConfig**(< _boolean_ >reload) - _(Promise)_

Loads EdgeRouter configuration to local cache for other methods.
If already loaded, cached version will be returnned unless _reload_ parameter is true.
Usually not needed to be called, as other methods call it themselves automatically.

### **dhcp**() - _(Promise)_

Returns EdgeRouter DHCP clients.
It automatically calls this.loadConfig() if config has not been loaded.
Returned resolved promise is a hash in a form below:
```
{
  '192.168.1.4': { mac: '12:34:56:78:9a:bc', host: 'my-laptop', static: 1 },
  '192.168.1.5': { mac: '34:56:78:9a:bc:12', host: 'my-desktop', static: 1 },
  '192.168.1.101': { mac: '56:78:9a:bc:12:34', host: '' }
}
```
Property _static_ indicates this is a static assignment of IP address, otherwise it is dynamic lease.

### **dns**() - _(Promise)_

Returns EdgeRouter static DNS records.
It automatically calls this.loadConfig() if config has not been loaded.
Returned resolved promise is a hash in a form below:
```
{
  '192.168.1.4': [ 'my-laptop', 'my-laptop-alias' },
  '192.168.1.5': { 'my-desktop' }
}
```
First item in array is configured hostname, all others are configured aliases for this hostname.
