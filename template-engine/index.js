const fs=require('fs');
const express=require('express');
const multer=require('multer');

//const upload=multer({dest:'./uploads/imagenes'});

const exphbs=require('express-handlebars');
const path=require("path");
const Handlebars = require("handlebars");

const puerto=8000;
const app=express();
const hbs=exphbs.create();

app.use(express.static(path.join(__dirname, '../public')));
app.engine('handlebars',hbs.engine);
app.set('view engine','handlebars');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/uploads`));

Handlebars.registerHelper('isNotNull', function (value) {
  return value !== null;
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/imagenes');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.shortName}.jpg`);
  },
});
const upload = multer({ storage: storage });

function newTeam(team,file) {

  const newTeam= {
    id:team.id,
    area: {
      id:Number(team.areaId),
      name:team.areaName,
    },
    name:team.name,
    shortName:team.shortName,
    tla:team.tla,
    crestUrl:  (file==="crest") ? team.urlImage : `/imagenes/${file}`,
    address:team.address,
    phone:team.phone,
    website:team.website,
    email:team.email,
    founded:team.founded,
    clubColors:team.clubColors,
    venue:team.venue,
    lastUpdated:team.lastUpdated,
  }

  return newTeam;
}

function checkId(equipos) {
  let allIds=[];
  equipos.forEach(equipo=> {
    allIds.push(equipo.id)
  })
  return allIds;
}


app.get('/',(req,res)=> {
  const equipos=JSON.parse(fs.readFileSync('./data/equipos.db.json'))
  res.render('teams', {
    layout:'ui',
    equipos,
  })
})

app.get('/:tla/ver',(req,res)=> {
  const equipos=JSON.parse(fs.readFileSync('./data/equipos.db.json'));
  const equipo=equipos.filter(equipo=>equipo.tla==`${req.params['tla']}`)

    res.render('team', {
      layout:'ui',
      data: {
        name:equipo[0].name,
        crestUrl:equipo[0].crestUrl,
        address:equipo[0].address,
        website:equipo[0].website,
        founded:equipo[0].founded,
        squad: (fs.existsSync(`./data/equipos/${req.params['tla']}.json`)) ? JSON.parse(fs.readFileSync(`./data/equipos/${req.params['tla']}.json`)).squad : ""
      }
    })
})

app.get('/:tla/delete',(req,res)=> {
  const equipos=JSON.parse(fs.readFileSync('./data/equipos.db.json'));
  const equiposRestantes=equipos.filter(equipo=>equipo.tla!==`${req.params['tla']}`);
  fs.writeFileSync('./data/equipos.db.json',JSON.stringify(equiposRestantes))
  fs.unlinkSync(`./data/equipos/${req.params['tla']}.json`);
  res.redirect('/')
})

app.listen(puerto)

app.get('/form',(req,res)=> {
  res.render('form', {
    layout:'ui',
  })
})

app.post('/form', upload.single('uploadedImage'),(req,res)=> {
  const equipos=JSON.parse(fs.readFileSync('./data/equipos.db.json'));
  const checkingId=checkId(equipos);
  if(checkingId.find(el=>el==req.body.id)!==undefined) {
    res.render('form', {
      layout:'ui',
      data: {
        error:`El id ${req.body.id} ya existe`
      }
    })
  } else {
  equipos.push(newTeam(req.body,(req.file!==undefined) ? req.file.filename : "crest"));
  fs.writeFileSync('./data/equipos.db.json',JSON.stringify(equipos))
  fs.writeFileSync(`./data/equipos/${req.body.tla}.json`,JSON.stringify(newTeam(req.body,(req.file!==undefined) ? req.file.filename : "crest")))
  res.redirect('/')
  }

});

app.get('/:tla/edit',(req,res)=> {
  const equipos=JSON.parse(fs.readFileSync('./data/equipos.db.json'));
  const equipo=equipos.filter(equipo=>equipo.tla==`${req.params['tla']}`);

  res.render('editForm', {
    layout:'ui',
    data: {
      id:equipo[0].id,
      area: {
        id:equipo[0].area.id,
        name:equipo[0].area.name,
      },
      name:equipo[0].name,
      shortName:equipo[0].shortName,
      tla:equipo[0].tla,
      crestUrl:equipo[0].crestUrl,
      address:equipo[0].address,
      phone:equipo[0].phone,
      website:equipo[0].website,
      email:equipo[0].email,
      founded:equipo[0].founded,
      clubColors:equipo[0].clubColors,
      venue:equipo[0].venue,
      lastUpdated:(equipo[0].lastUpdated).slice(0,-10),

      //plantilla: (fs.existsSync(`./data/equipos/${req.param('tla')}.json`)) ? JSON.parse(fs.readFileSync(`./data/equipos/${req.param('tla')}.json`)).squad : ""
    }

  })
})
app.post('/:tla/edit', upload.single('uploadedImage'),(req,res)=> {

  const equipos=JSON.parse(fs.readFileSync('./data/equipos.db.json'));
  const equiposRestantes=equipos.filter(equipo=>equipo.tla!==`${req.body.tla}`);
  equiposRestantes.push(newTeam(req.body,(req.file!==undefined) ? req.file.filename : "crest"));
  fs.writeFileSync('./data/equipos.db.json',JSON.stringify(equiposRestantes));
  res.redirect('/')

})

