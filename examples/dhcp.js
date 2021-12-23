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
    console.log('DHCP Clients:', await router.dhcp())
  }catch(e){
    console.error('Error:',e.message)
  }
  try{ await router.close() }catch(e){}
}
run()
