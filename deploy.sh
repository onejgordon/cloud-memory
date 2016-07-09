APPCFG=~/google_appengine/appcfg.py # Customize based on local setup

rollback(){
	echo -e "\nRolling back.....\n"
	python APPCFG rollback --oauth2 $(dirname $0)
}

check_server_tests(){
	./run_tests.sh
	RESULT=$?
	if [ $RESULT -ne 0 ]; then
		echo -e "\nSERVER UNIT TESTS FAILED!\n"
		cancel_deploy
	fi
}

check_js_tests(){
	npm test
	RESULT=$?
	if [ $RESULT -ne 0 ]; then
		echo -e "\nJEST UNIT TESTS FAILED!\n"
		cancel_deploy
	fi
}

check_indexes(){
	indexes_diff=$(git diff index.yaml)
	if [[ -n $indexes_diff ]]; then
		echo
		echo "$indexes_diff"
		echo
		echo -e "\nUNCOMMITED INDEXES FOUND!\n"
		cancel_deploy
	fi
}

deploy(){
	check_indexes
	check_server_tests
	check_js_tests
	gulp production
	python $APPCFG update --oauth2 $(dirname $0)
}

cancel_deploy(){
	echo -e "\nExitted without updating $version!\n"
	exit 1
}

if [ "$1" = "rollback" ]; then
	rollback
fi

version_line=$(grep "^version:" $(dirname $0)/app.yaml);
version=${version_line##* };

read -p "Are you sure you want to deploy to $version? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
	#production versions only contain digits, hf and - (dash)
	if [[ $version =~ ^[0-9hf\-]+$ ]]; then
		read -p "This looks like a production version ($version), Are you really sure? (y/n) " -n 1 -r
		echo
		if [[ $REPLY =~ ^[Yy]$ ]]; then
			# if no tag yet create it, then push tags
			git tag -a -m "New production version by $(whoami) on $(date)" "v$version"
			git push --tags
			# deploy production version
			deploy
			echo -e "\n\nDeploy to production Successful!\n"
		else
			cancel_deploy
		fi
	else
		#deploy non-production version
		deploy
	fi
else
	cancel_deploy
fi
