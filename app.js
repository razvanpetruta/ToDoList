const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

// create the app using express
const app = express();

// use ejs
app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to database
mongoose.connect("mongodb+srv://adminandpass@cluster0.vgsls.mongodb.net/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// get request for home route
app.get("/", function(req, res) {
    Item.find({},function(err, foundItems) {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("list", {listTitle: "Today", listItems: foundItems, route: "/"});
        }
    });
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    if(customListName === "Today")
    {
        res.redirect("/");
    }

    List.findOne({name: customListName}, function(err, foundList) {
        if(err)
        {
            console.log(err);
        }
        else
        {
            if(!foundList)
            {
                // create a new list
                const list = new List(
                    {
                        name: customListName,
                        items: []
                    }
                );

                list.save(function(err) {
                    if(!err)
                    {
                        res.redirect("/" + customListName);
                    }
                });
            }
            else
            {
                // show an existing list
                res.render("list", {listTitle: foundList.name, listItems: foundList.items, route: "/" + foundList.name});
            }
        }
    });
});

// post request for home route
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item (
        {
            name: itemName
        }
    );

    if(listName === "Today")
    {
        item.save(function(err) {
            if(!err)
            {
                res.redirect("/");
            }
        });
    }
    else
    {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save(function(err) {
                if(!err)
                {
                    res.redirect("/" + listName);
                }
            });
        });
    }
});

// post request for delete route
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today")
    {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if(err)
            {
                console.log("There was an error!");
            }
            else
            {
                setTimeout(function() {
                    res.redirect("/");
                }, 500);
            }
        });
    }
    else
    {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
            if(err)
            {
                console.log(err);
            }
            else
            {
                setTimeout(function() {
                    res.redirect("/" + listName);
                }, 500);
            }
        });
    }
});

// redirect to another list
app.post("/redirect", function(req, res) {
    const newRoute = _.capitalize(req.body.newRoute);

    if(newRoute === "Today")
    {
        res.redirect("/");
    }
    else
    {
        res.redirect("/" + newRoute);
    }
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server started.");
});