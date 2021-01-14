const express = require(`express`)
const router = new express.Router()
const auth = require(`../middleware/auth`)
const User = require(`../models/user`)
const multer = require(`multer`)
const sharp = require(`sharp`)
const { sendWelcomeEmail, deleteAccount} = require(`../emails/account`)

// POST USERS OR SIGN UP

router.post(`/users`, async (req, res) => {
  const user = new User(req.body)

  try{
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = user.generateAuthToken() 
    res.status(201).send({user, token})
  } catch (e) {
    res.status(400).send(e)
  }
 
})
// UPLOADING IMAGE
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
      return cb(new Error(`Please upload an image`))
    }
    cb(undefined, true)
  }
})

router.post(`users/me/avatar`, auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({error: error.message})
})

// FINDING USER BY THEIR LOGIN
router.post(`/users/login`, async(req, res) => {
  try {
    const user = await User. findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
  }
})

// LOGOUT
router.post(`/users/logout`, auth, async(req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save() 

    res.send()
  }catch(e) {
    res.status(500).send()

  }
})

// LOGOUT ALL
router.post('/users/logoutAll', auth, async(req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  }catch(e) {
    res.status(500).send()
  }
})


// FETCH USERS
router.get(`/users/me`, auth, async(req, res) => {
  res.send(req.user)
}) 


// UPDATING USER
router.patch(`/users/me`, auth,  async(req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((updates) =>  allowedUpdates.includes(updates))

  if (!isValidOperation) {
    return res.status(400).send({error: 'invalid updates!'})
  } 

  try {
    updates.forEach((update) => req.user[update] = req.body[update])
    await req.user.save()
    res.send(req.user)
  }catch (e) {
    res.status(400).send(e)
  }
})

// DELETING PROFILE IMAGE
router.post('/users/me/avatar', auth, async(req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})


// DELETING USER
router.delete(`/users/me`, auth, async(req, res) => {
  try{
    await req.user.remove
    deleteAccount(req.user.email, req.user.name)
    res.send(req.user)
  }catch(e){
    res.status(500).send()
  }
})

// IMAGE SERVED UP TO THE USER PROFILE
router.get('/users/:id/avatar', async (req,res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw  new Error()
    }

    res.set(`content-type`, 'image/png')
    res.send(user.avatar)

  } catch(e) {
    res.status(404).send()
  }
})


module.exports = router