// SSJS-only sample — intentionally messy input to show formatting.
// The plugin routes .ssjs through Prettier's babel parser.
// Save (format-on-save) or run Format Document to see it cleaned up.

Platform.Load(  "core","1.1.5"  );

var prox=new Script.Util.WSProxy();
var cols=["Email","FirstName","LastName","Status"];
var filter={Property:"Status",SimpleOperator:"equals",Value:"Active"};

var result = prox.retrieve( "DataExtensionObject[MyDataExtension]" , cols , filter );

if(result&&result.Results){
for(var i=0;i<result.Results.length;i++){
var row=result.Results[i];
Write("<p>Email: "+row.Properties[0].Value+"</p>");
}
}

var data=Platform.Function.ParseJSON('{"name":"Test","value":123}');
var json=Platform.Function.Stringify(data);

function greet( name ){return "Hello, "+name}

var names=["a","b","c"];
var upper=names.map(function(n){return n.toUpperCase()});
