'use strict'
const SSH2Promise = require('ssh2-promise')

module.exports = class EdgeRouter extends SSH2Promise{
	async execWrapper(...args){
		try{
			return await this.exec(...args)
		}catch(e){
			throw new Error(e.toString())
		}
	} // execWrapper

	async loadConfig(reload){
		if(!reload && this.boot_config) return this.boot_config
		delete this.boot_config
		this.boot_config = await this.execWrapper('cat /config/config.boot')
		return this.boot_config
	} // loadConfig

	async dhcp(){
		// read static DHCP configuration
		const config = await this.loadConfig()
		let item
		const re = /static-mapping\s+(\S+)\s*\{([^}]*)\}/g
		const hosts = {}
		while(item = re.exec(config)){
			const [,host,def] = item
			const [,ip] = /^\s*ip-address\s+(\S+)/m.exec(def) || []
			const [,mac] = /^\s*mac-address\s+(\S+)/m.exec(def) || []
			hosts[ip] = {mac,host,static:1}
		}

		// read dynamically assigned DHCP leases
		const leases = await this.execWrapper('/opt/vyatta/bin/vyatta-op-cmd-wrapper show dhcp leases')
		const lines = leases.replace(/[\s\S]*-----------\n/,'').split('\n')
		for(let line of lines){
			const [ip,mac,expiry,pool,host] = line.split(/\s{2,}/)
			if(ip){
				hosts[ip] = {mac,host}
			}
		}
		return hosts
	} // dhcp

	async dns(){
		// read static host mappings
		const config = await this.loadConfig()
		const [,static_host_mapping] = /static-host-mapping\s*\{([\s\S]*?\})\s*\}/.exec(config) || []
		let item
		const re = /host-name\s+(\S+)\s*\{([^}]*)\}/g
		const hosts = {}
		while(item = re.exec(static_host_mapping)){
			const [,hostname,def] = item
			const [,inet] = /^\s*inet\s+(\S+)/m.exec(def) || []
			let [,aliases] = /^\s*alias\s+(\S+)/m.exec(def) || []
			if(aliases) aliases = aliases.split(',')
			else aliases = []
			aliases.unshift(hostname)
			aliases = aliases.filter((v, i)=>aliases.indexOf(v)==i)
			hosts[inet] = aliases
		}
		return hosts
	} // dns
} // class EdgeRouter
