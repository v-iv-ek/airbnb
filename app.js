const express=require('express');
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js")
const methodOverride=require("method-override")
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapsAsync.js")
const ExpressError=require("./utils/ExpressError.js")
const {listingSchema}=require("./schema.js")



const path=require('path');
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")))




// Mongo Database connecting
const MONGO_URL = "mongodb://127.0.0.1:27017/airbnB";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// validating Listing
const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",")
        throw new ExpressError(400,errMsg)
    }else{
        next();
    }
}

//Index Route
app.get("/listings",async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
})

// Newroute
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs")
})

//create Route
app.post("/listings",validateListing, wrapAsync(async(req,res,next)=>{
         let result=listingSchema.validate(req.body);
         console.log(result);
         const newListing=new Listing(req.body.listing);
        await newListing.save();  
        res.redirect("/listings")
   
}))

// Show Route
app.get("/listings/:id", wrapAsync(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/show.ejs",{listing})

}))


// edit route
app.get("/listings/:id/edit", wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing})
}))

//update route
app.put("/listings/:id",validateListing, wrapAsync(async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing})
    res.redirect(`/listings/${id}`)
}))

// Deleted route
app.delete("/listings/:id", wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let deleteListing= await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    res.redirect("/listings")
}))

app.get("/",(req,res)=>{
    res.send("<h1>Root page</h1>")
})      



app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found"))
})

//middleware to check the data server side
app.use((err,req,res,next)=>{
    let {statusCode=404 ,message="Something went wrong"}=err;
    res.render("error.ejs",{message}).statusCode=(statusCode);
    // res.status(statusCode).send(message)
})
app.listen(3000,()=>{
    
        console.log(`Server connceted at 3000`)
    
})