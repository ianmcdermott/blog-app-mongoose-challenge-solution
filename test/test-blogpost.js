const faker = require('./faker');
const mongoose = require('./mongoose');
const chai = require('./chai');
const chaiHttp = require('./chai-http');

const should = chai.should

const {BlogPost} = require('../models')
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData(){
	console.info('seeding blogpost data');
	const seedBlogPost = [];

	for(let i = 0; i <= 10; i++){
		seedBlogPost.push(generateBlogPostData());
	}

	return BlogPost.insertMany(seedData);
}

function generateBlogPostData(){
	return{
		name: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()	
		} 
		content: faker.lorem.sentence(),
		title: faker.lorem.words(),
		date: faker.data.past()
	}
}

function tearDownDb(){
	console.warn("Deleting database");
	return mongoose.connection.dropDatabase();
}

describe('BlogPosts API resource' function(){

	describe('BlogPost API resource', function(){
		before(function(){
			return runserver(TEST_DATABASE_URL);
		});

		beforeEach(function(){
			return seedBlogPostData();
		});

		afterEach(function(){
			return tearDownDb();
		});

		after(function(){
			return closeServer();
		});
	})

	describe('GET endpoint', function(){
		it("Should return all existing blogposts", function(){
			//declare res here to access across then calls
			let res;
			return chai.request(app)
			//get back all blogposts returned by endpoint /blogPostRouter
				.get('/blogposts')
				.then(function(_res){
					res = _res;
					//prove response has correct status and types
					res.should.have.status(200);
					res.should.be.json;
					res.body.length.should.be.at.least(1);

					return BlogPost.count();
				})
				.then(function(count){
					res.body.blogposts.should.have.a.length.of(count);
				});
		});

		it('Should return blogposts with the right fields', function(){
			let resBlogPost;

			return chai.request(app)
				.get('/blogposts')
				.then(function(res){
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a('array');
					res.body.blogposts.should.have.length.of.at.least(1);

					res.body.blogposts.forEach(function(blogpost){
						blogpost.should.be.a('object');
						res.should.include.keys(
							'id', 'author', 'title', 'content', 'date'
							);
					});
					resBlogPost = res.body.blogposts[0];
					return BlogPost.findById(resBlogPost.id);
				})

				.then(function(blogpost){
					resBlogPost.id.should.equal(blogpost.id);
					resBlogPost.author.should.contain(blogpost.author.firstName);
					resBlogPost.title.should.equal(blogpost.title);
					resBlogPost.content.should.equal(blogpost.content);
					resBlogPost.date.should.equal(blogpost.date);
					
				});

		});
	});

	describe('POST endpoint', function(){
		it("Should add blogpost to DB", function(){
			const newBlogPost = generateBlogPostData();

			return chai.request(app)
				.post('/blogposts')
				.send(newBlogPost)
				.then(function(){
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.author.should.contain(newBlogPost.author.firstName);
					res.body.id.should.not.be.null;
					res.body.title.should.equal(newBlogPost.title);
					res.body.content.should.equal(newBlogPost.content);

					return BlogPost.findById(res.body.id);

				})
				.then(function(blogpost){
					blogpost.author.firstName.should.equal(newBlogPost.author.firstName);
					blogpost.author.lastName.should.equal(newBlogPost.author.lastName);

					blogpost.title.should.equal(newBlogPost.title);
					blogpost.content.should.equal(newBlogPost.content);
					blogpost.content.should.equal(newBlogPost.content);

				});

		});
	});

	describe('PUT endpoint', function(){
		it("Should update blogpost in DB", function(){
			const updateData = {

				  author: {
				    firstName: "Mel",
				    lastName: "Brookes"
				  },
				  title: "Brooky Wooks",
				  content: "Brooky Bricky Whicky Wooks",
				};

			return blogPost
				.findOne();
				.then(function(blogpost){
					updateData.id = blogpost.id;

					return chai.request(app)
						.put(`blogposts/${blogpost.id}`)
						.send(updateData);
				})
				//make sure proper status, no content
				.then(function(res){
					res.should.have.status(204);
				})
				.then(function(blogpost){
					blogpost.author.firstName.should.equal(updateData.author.firstName);
					blogpost.content.should.equal(updateData.content);
					blogpost.title.should.equal(updateData.title);

				});
		});
	});

	describe('DELETE endpoint', function(){
		it("Should remove blogpost in DB", function(){
			let blogpost;

			//find and delete a post
			return BlogPost
				.findOne()
				.then(function(_blogpost){
					blogpost = _blogpost;
					return chai.request(app).delete(`/blogpost/${blogpost.id}`);
				})
				//make sure proper status, no content
				.then(function(res){
					res.should.have.status(204);
					return BlogPost.findById(blogpost.id);
				})
				//make sure post has been removed based on id
				.then(function(_blogpost){
					should.not.exist(_blogpost)
				});
		});
	});
});