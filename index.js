const app = require('express')()
const fs = require('fs')
const moment = require('moment')
const SerialPort = require('serialport')
const PORT = 'COM4'
const pattern = /(\d+\.{1}\d+\/\d+\.{1}\d+\/\d+\.{1}\d+)/g
const outputs = []
const FATOR_CORRECAO_W_CV = 0.00135962

const mapValores = index => {
	switch (index) {
		case 0:
			return 'Tensão: '
		case 1:
			return 'Corrente: '
		case 2:
			return 'RPM: '
	}
}

const serial = new SerialPort(
	PORT,
	{
		baudRate: 57600,
	},
	err => {
		console.log(err)
	}
)

serial.on('data', data => {
	const dataString = async () => {
		return await data.toString('utf8')
	}

	dataString().then(valor => {
		if (pattern.test(valor)) {
			const valorSplit = valor.trim().split('/')
			const tensao = parseFloat(valorSplit[0])
			const corrente = parseFloat(valorSplit[1]) * 1000
			const rpm = 50 + Math.floor(Math.random() * 100);
			const horario = Date()
			const potencia = tensao * (corrente / 1000) 
			let torque = 0
			if (rpm > 0) {
				torque = potencia * FATOR_CORRECAO_W_CV * 60.75 / Math.PI * rpm
			}
			outputs.push({
				tensao,
				corrente,
				rpm,
				potencia,
				torque,
				horario,
			})

			let stringResposta = `Tensão: ${tensao} V\n`
			stringResposta += `Corrente: ${corrente} mA\n`
			stringResposta += `Rotações: ${rpm} RPM\n`
			stringResposta += `Potência: ${potencia} W\n`
			stringResposta += `Torque = ${torque} Kgf.m\n`
			stringResposta += `Horário: ${horario}\n`
			stringResposta += `-----------------------------------\n`

			fs.writeFile(
				'read.txt',
				stringResposta,
				{ enconding: 'utf-8', flag: 'a' },
				function(err) {
					if (err) throw err
				}
			)
		}
	})
})

app.listen(3000, () => {
	console.log('Server open')
})

app.get('/dados', (req, res) => {
	res.send(outputs)
})

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/home.html')
})
