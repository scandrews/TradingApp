

module.exports = function(sequelize, Datatypes){
	var Quotes = sequelize.define("Quotes", {
		symbol: {
			type: Datatypes.varchar,
			allowNull: false
		},
		askprice: {
			type: Datatypes.FLOAT,
			allowNull: false
		},
		asksize: {
			type: Datatypes.FLOAT
		},
		bidprice: {
			type: Datatypes.FLOAT
		},
		bidsize: {
			type: Datatypes.FLOAT
		},
		Timestamp: {
			type: Datatypes.TIME
		},
		conditions: {
			type: Datatypes.varchar
		}
	});
	return Quotes;

	var temperatures = sequelize.define("temperatures",{
		tempOutDoorsSun: {
			type: Datatypes.FLOAT,
			allowNull: false,
		},
		tempOutDoorsShade: {
			type: Datatypes.FLOAT,
			allowNull: false,
		},
		tempFamilyRoom: {
			type: Datatypes.FLOAT,
			allowNull: false,
		},
		tempBedRoom: {
			type: Datatypes.FLOAT,
			allowNull: false,	
		},
		tempDesk: {
			type: Datatypes.FLOAT,
			allowNull: false,	
		},
		tempPipe: {
			type: Datatypes.FLOAT,
			allowNull: false,	
		},
		tempWaterTank: {
			type: Datatypes.FLOAT,
			allowNull: false,	
		},
		tempWoodStove: {
			type: Datatypes.FLOAT,
			allowNull: false,	
		},
		tempFurnace: {
			type: Datatypes.FLOAT,
			allowNull: false,	
		},
		furnaceOnOff: {
			type: Datatypes.varchar(16),
			allowNull: false,	
		},
		createdAt: {
			type: Datatypes.TIMESTAMP,
			allowNull: false,	
		}
	});
	return temperatures;

	var recirculatorHistory = sequelize.define("recirculatorHistory",{
		pipetemperatures: {
			type: Datatypes.FLOAT
		},
		recircOnOff: {
			type: Datatypes.int (2)
		},
		recircHist: {
			type: Datatypes.TIMESTAMP
		}
	});
	return recirculatorHistory;
	
};

/*
use trading_app_db;

drop table recirculatorhistory;

drop table temperatures;

drop table recirculatorsettings;

create table temperatures(
	id integer(10)auto_increment not null,
	symbol varchar,
	askprice FLOAT,
	asksize FLOAT,
	bidprice FLOAT,
	bidsize FLOAT,
	Timestamp TIME,
	conditions varchar,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    primary key (id)
    );


create table recirculatorSettings(
	id integer(10)auto_increment not null,
	pipeTempOn FLOAT,
	pipeTempOff FLOAT,
	weekDayOn1 time,
	weekDayOff1 time,
	weekDayOn2 time,
	weekDayOff2 time,
	weekEndOn1 time,
	weekEndOff1 time,
	weekEndOn2 time,
	weekEndOff2 time,
    primary key (id)
);

create table recirculatorHistory(
	id integer(10)auto_increment not null,
	pipetemperatures FLOAT,
	recircOnOff VARCHAR (16),
	recircHist TIMESTAMP,
    primary key (id)
);
*/
