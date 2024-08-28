const token =  require("../../src/handlers/token");
 
test("Test Token", async ()=>{

    let demoFile = {
    }
    let Req = await token.createToken(demoFile);

    expect(Req.code).toEqual(200);
 
});

 